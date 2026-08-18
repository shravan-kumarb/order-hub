import { cloneMenu } from '../domain/menu.js';
import type { MenuItem } from '../domain/types.js';

/** Simple in-memory store — resettable for API tests. */
let menu: MenuItem[] = cloneMenu();

export function getMenu(): MenuItem[] {
  return menu;
}

export function resetStore(): void {
  menu = cloneMenu();
}
