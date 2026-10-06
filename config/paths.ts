import fs from "fs";
import path from "path";

export function projectRoot(): string {
  let dir = __dirname;
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error("Could not find the project root from " + __dirname);
    }
    dir = parent;
  }
}
