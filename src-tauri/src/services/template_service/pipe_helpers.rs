//! Pipe-function helper implementations for the template engine.
//!
//! Each helper extracts its first param as a string and writes a transformed result.

use handlebars::{
    Context, Handlebars, Helper, HelperDef, HelperResult, Output, RenderContext,
};

/// Register all pipe-function helpers onto a Handlebars registry.
pub fn register_pipe_helpers(hbs: &mut Handlebars) {
    hbs.register_helper("uppercase", Box::new(UppercaseHelper));
    hbs.register_helper("upper", Box::new(UppercaseHelper));
    hbs.register_helper("lowercase", Box::new(LowercaseHelper));
    hbs.register_helper("lower", Box::new(LowercaseHelper));
    hbs.register_helper("trim", Box::new(TrimHelper));
    hbs.register_helper("capitalize", Box::new(CapitalizeHelper));
    hbs.register_helper("reverse", Box::new(ReverseHelper));
    hbs.register_helper("length", Box::new(LengthHelper));
    hbs.register_helper("slugify", Box::new(SlugifyHelper));
    hbs.register_helper("truncate", Box::new(TruncateHelper));
    hbs.register_helper("default", Box::new(DefaultHelper));
}

struct UppercaseHelper;
impl HelperDef for UppercaseHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        out.write(&val.to_uppercase())?;
        Ok(())
    }
}

struct LowercaseHelper;
impl HelperDef for LowercaseHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        out.write(&val.to_lowercase())?;
        Ok(())
    }
}

struct TrimHelper;
impl HelperDef for TrimHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        out.write(val.trim())?;
        Ok(())
    }
}

struct CapitalizeHelper;
impl HelperDef for CapitalizeHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        let mut c = val.chars();
        let capitalized = match c.next() {
            None => String::new(),
            Some(f) => f.to_uppercase().to_string() + c.as_str(),
        };
        out.write(&capitalized)?;
        Ok(())
    }
}

struct ReverseHelper;
impl HelperDef for ReverseHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        out.write(&val.chars().rev().collect::<String>())?;
        Ok(())
    }
}

struct LengthHelper;
impl HelperDef for LengthHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        out.write(&val.len().to_string())?;
        Ok(())
    }
}

struct SlugifyHelper;
impl HelperDef for SlugifyHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        let slug: String = val.to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .split('-')
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join("-");
        out.write(&slug)?;
        Ok(())
    }
}

struct TruncateHelper;
impl HelperDef for TruncateHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        let limit = h.param(1)
            .and_then(|p| p.value().as_str())
            .and_then(|s| s.parse::<usize>().ok())
            .unwrap_or(80);
        if val.len() > limit {
            out.write(&format!("{}\u{2026}", &val[..limit]))?;
        } else {
            out.write(val)?;
        }
        Ok(())
    }
}

struct DefaultHelper;
impl HelperDef for DefaultHelper {
    fn call<'reg: 'rc, 'rc>(
        &self, h: &Helper<'rc>, _: &'reg Handlebars<'reg>, _: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>, out: &mut dyn Output,
    ) -> HelperResult {
        let val = h.param(0).and_then(|p| p.value().as_str()).unwrap_or("");
        let fallback = h.param(1).and_then(|p| p.value().as_str()).unwrap_or("");
        if val.is_empty() {
            out.write(fallback)?;
        } else {
            out.write(val)?;
        }
        Ok(())
    }
}
