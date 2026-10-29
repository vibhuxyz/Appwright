import { describe, expect, it } from "bun:test";
import { isConversationalMessage } from "../src/conversational-message";

describe("isConversationalMessage", () => {
  const conversational = ["thanks", "thank you", "ok", "okay", "looks good", "lgtm", "nice", "great", "cool", "hy", "hi", "hello", "hey", "yo", "Thanks!", "ok, looks good"];
  for (const message of conversational) {
    it(`treats "${message}" as chat`, () => {
      expect(isConversationalMessage(message)).toBe(true);
    });
  }

  const requests = ["make the button blue", "fix the contact form", "TypeError: x is undefined", "build a bakery site", "thanks, now add a pricing page"];
  for (const message of requests) {
    it(`treats "${message}" as a request`, () => {
      expect(isConversationalMessage(message)).toBe(false);
    });
  }
});
