declare module 'markdownlint-cli2' {
  export interface MarkdownlintOptions {
    config?: string;
    fix?: boolean;
    argv?: Array<string>;
    [key: string]: unknown;
  }

  export interface MarkdownlintModule {
    main(options: MarkdownlintOptions): Promise<number>;
  }

  const markdownlintCli2: MarkdownlintModule;
  export default markdownlintCli2;
}
