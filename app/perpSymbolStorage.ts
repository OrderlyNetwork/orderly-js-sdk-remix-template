import {
  getStoredPerpSymbol,
  setStoredPerpSymbol,
} from "@orderly.network/utils";
import { DEFAULT_SYMBOL } from "./constant";

export { DEFAULT_SYMBOL };

export function getPerpSymbol() {
  return getStoredPerpSymbol() ?? DEFAULT_SYMBOL;
}

export function setPerpSymbol(symbol: string) {
  setStoredPerpSymbol(symbol);
}
