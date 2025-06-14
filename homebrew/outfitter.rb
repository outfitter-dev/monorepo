class Outfitter < Formula
  desc "Command-line tool for equipping your development journey with configurations and fieldguides"
  homepage "https://github.com/outfitter-dev/monorepo"
  url "https://registry.npmjs.org/outfitter/-/outfitter-0.1.0.tgz"
  # TODO: Update SHA256 after first npm publish
  # Calculate with: curl -s https://registry.npmjs.org/outfitter/-/outfitter-0.1.0.tgz | shasum -a 256
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "node"

  def install
    ENV["NODE_ENV"] = "production"
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/outfitter --version")
  end
end
