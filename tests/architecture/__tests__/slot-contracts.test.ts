import { describe, it, expect } from 'vitest';
import { AppLayoutSlots } from '../../../src/lib/components/layout/AppLayout.slots';
import { ResizablePanelSlots } from '../../../src/lib/components/layout/ResizablePanel.slots';
import { DrawerSlots } from '../../../src/lib/components/ui/layout/panels/Drawer.slots';
import type { SlotContract } from '../../../src/lib/types/layout';

const ALL_CONTRACTS: Record<string, SlotContract> = {
  AppLayout: AppLayoutSlots,
  ResizablePanel: ResizablePanelSlots,
  Drawer: DrawerSlots,
};

describe('T-23: SlotContract structural validation', () => {
  for (const [componentName, contract] of Object.entries(ALL_CONTRACTS)) {
    describe(`${componentName} slots`, () => {
      it('has at least one slot defined', () => {
        expect(Object.keys(contract).length).toBeGreaterThan(0);
      });

      for (const [slotKey, zone] of Object.entries(contract)) {
        it(`slot "${slotKey}" has non-empty name`, () => {
          expect(zone.name).toBeTruthy();
          expect(zone.name.length).toBeGreaterThan(0);
        });

        it(`slot "${slotKey}" has non-empty description`, () => {
          expect(zone.description).toBeTruthy();
          expect(zone.description.length).toBeGreaterThan(10);
        });

        it(`slot "${slotKey}" has mustNotContain array`, () => {
          expect(Array.isArray(zone.mustNotContain)).toBe(true);
        });

        it(`slot "${slotKey}" name matches its key`, () => {
          expect(zone.name).toBe(slotKey);
        });
      }

      it('no duplicate slot names within contract', () => {
        const names = Object.values(contract).map((z) => z.name);
        const unique = new Set(names);
        expect(unique.size).toBe(names.length);
      });

      it('at least one slot is marked required', () => {
        const hasRequired = Object.values(contract).some((z) => z.required === true);
        expect(hasRequired).toBe(true);
      });
    });
  }
});
