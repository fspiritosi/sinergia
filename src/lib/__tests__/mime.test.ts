import { describe, it, expect } from "vitest";
import { contentTypeFromKey } from "../mime";

describe("contentTypeFromKey", () => {
  it("maps jpg and jpeg to image/jpeg", () => {
    expect(contentTypeFromKey("inspecciones/a/b/1.jpg")).toBe("image/jpeg");
    expect(contentTypeFromKey("inspecciones/a/b/1.jpeg")).toBe("image/jpeg");
  });

  it("maps png to image/png", () => {
    expect(contentTypeFromKey("inspecciones/a/b/1.png")).toBe("image/png");
  });

  it("maps webp to image/webp", () => {
    expect(contentTypeFromKey("x/1.webp")).toBe("image/webp");
  });

  it("is case-insensitive with the extension", () => {
    expect(contentTypeFromKey("x/1.JPG")).toBe("image/jpeg");
  });

  it("falls back to application/octet-stream for unknown or missing extension", () => {
    expect(contentTypeFromKey("x/noext")).toBe("application/octet-stream");
    expect(contentTypeFromKey("x/file.heic")).toBe("application/octet-stream");
  });
});
