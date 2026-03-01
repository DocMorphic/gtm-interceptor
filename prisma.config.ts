import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
