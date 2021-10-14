const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env) => {
    const { prod, clean } = env;
    mode = prod ? "production" : "development";
    console.log(mode);
    console.log(clean);
    console.log(env);

    return {
        devtool: "inline-source-map",
        entry: {
            app:"./src/app.ts"
        },
        mode,
        output: {
            path: path.resolve(process.cwd(), "dist"),
            filename: "[name].[contenthash].js",
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                }
            ],
        },
        plugins:[
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: "src/index.html",
            }),
        ],
        resolve: {
            extensions: [".ts", ".tsx", ".jsx", ".js", ".html"],
            fallback: {
                buffer: require.resolve("buffer/"),
            },
        },
        devServer: {
            open: true,
        },
    };
};
