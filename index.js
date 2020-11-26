#!/usr/bin/env node
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const outdent = require("outdent");
fs.mkdirSync(path.join(process.cwd(), "src"));
fs.mkdirSync(path.join(process.cwd(), '.github'));
const writeFiles = (files) => {
  files.map((f) => {
    fs.writeFileSync(path.join(process.cwd(), f.path), outdent`${f.content}`);
  });
};
writeFiles([
  {
    path: "tsconfig.json",
    content: `
{
	"compilerOptions": {
		"lib": ["ESNext"],
		"module": "commonjs",
		"moduleResolution": "node",
		"target": "ESNext",
		"outDir": "dist",
		"sourceMap": true,
		"esModuleInterop": true,
		"experimentalDecorators": true,
		"emitDecoratorMetadata": true,
		"allowSyntheticDefaultImports": true,
		"skipLibCheck": true,
		"skipDefaultLibCheck": true,
		"declaration": true,
		"resolveJsonModule": true
	},
	"include": ["src"],
	"exclude": ["node_modules", "**/*.spec.ts"]
}
`,
  },
  {
    path: ".prettierrc",
    content: `
{
	"useTabs": true,
	"semi": true,
	"singleQuote": true
}
`,
  },
  { path: ".prettierignore", content: "dist\n.pnp.js\n.yarn/*" },
  { path: ".gitignore", content: "node_modules\ndist.yarn/*\n!.yarn/cache\n!.yarn/releases\n!.yarn/plugins\n!.yarn/sdks\n!.yarn/versions" },
  { path: '.github/dependabot.yml', content: `
  version: 2
  updates:
    - package-ecosystem: 'npm'
      directory: '/'
      schedule:
        interval: 'daily'
  `.trim() }
]);
cp.exec(`npm init -y`, { cwd: process.cwd() }, () => {

  cp.exec('yarn set version berry', { cwd: process.cwd() }, () => {
    cp.exec('yarn dlx @yarnpkg/pnpify --sdk vscode', { cwd: process.cwd() }, () => {
      cp.execSync('yarn plugin import "https://github.com/cometkim/yarn-plugin-bump/releases/download/v0.0.7/plugin-bump.js"', { cwd: process.cwd() })
      cp.execSync('git init', { cwd: process.cwd() });
      cp.exec(`yarn`, { cwd: process.cwd() }, () => {

        cp.exec('yarn plugin import typescript', { cwd: process.cwd() }, () => {

          cp.exec(
            `yarn add -D typescript ts-node ts-node-dev @types/node prettier @commitlint/cli @commitlint/config-angular husky lint-staged`,
            { cwd: process.cwd() }, (err) => {
          const content = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), "package.json")).toString()
          );
          content.scripts.test =
            "ts-node-dev --respawn --transpile-only --poll ./src/index.ts";
          content.scripts.lint = "prettier --write .";
          content.scripts.build = "tsc";
          content.husky = {};
          content.husky.hooks = {};
          content.husky.hooks["pre-commit"] = "yarn dlx @yarnpkg/doctor && lint-staged";
          content.husky.hooks["commit-msg"] = "commitlint -E HUSKY_GIT_PARAMS";
          content["lint-staged"] = {};
          content["lint-staged"]["*.ts"] = "prettier --write";
          content["lint-staged"]["*.js"] = "prettier --write";
          content["commitlint"] = {};
          content["commitlint"]["extends"] = ["@commitlint/config-angular"];
          content["commitlint"]["rules"] = {};
          const defRule = (n, c) => {
            content.commitlint.rules[n] = c;
          };
          defRule("scope-case", [2, "always", "pascal-case"]);
          defRule("type-enum", [
            2,
            "always",
            [
              "chore",
              "build",
              "ci",
              "docs",
              "feat",
              "fix",
              "perf",
              "refactor",
              "revert",
              "style",
              "test",
            ],
          ]);
          fs.writeFileSync(
            path.join(process.cwd(), "package.json"),
            JSON.stringify(content, null, 2)
          );
          fs.writeFileSync(path.join(process.cwd(), 'README.md'), outdent`
          # ${content.name}

          Created with [create-ts-pro](https://github.com/Milo123459/create-ts-pro)

          # create-ts-pro

          Features:
          
          * Yarn PnP
          * Husky config
          * Good defaults
          * Linters
          * Yarn bump command
          * Bump plugin & TypeScript plugin
          * Cool build / bundle commands (yarn.build)
          `);
        })
      });
      });
    });
  });
});