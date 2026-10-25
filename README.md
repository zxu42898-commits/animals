# 森野识物 · Animal Lens

移动端友好的动物识别网页，支持上传、拖拽照片以及手机拍照，提供 30 种动物图鉴。照片在浏览器内缩放并交由 Web Worker 本地推理，不上传到服务器。无需 API 密钥。

## 开发

需要 Node.js 20.19+ 或 22.12+（已在 Node.js 24 验证）。

```sh
npm ci --ignore-scripts --cache /tmp/animals-npm-cache
npm run dev -- --port 5173
```

纯浏览器项目使用 ONNX Runtime Web；`--ignore-scripts` 避免安装无用的服务端 ONNX CUDA 组件，npm 仍验证包完整性。手机摄像头体验取决于浏览器与系统；可随时使用照片上传。

```sh
npm test
npm run build
npm run preview
```

构建产物在 `dist/`，可部署到任意静态托管服务。首次识别需要从 Hugging Face 下载 `Xenova/vit-base-patch16-224` 的量化模型；之后浏览器可以复用缓存，清理缓存后需要重新下载。模型服务不可达时会提示失败并允许重试，不返回虚构结果。

## 网络要求

- `huggingface.co`、`*.huggingface.co`、`*.hf.co`：模型配置与文件。
- `cdn.jsdelivr.net`：ONNX 运行时可能使用的资源。
- 安装依赖需要 `registry.npmjs.org`。

在限制联网的云环境中需在环境设置保存允许规则，再发布环境。保存草稿本身不会立刻改变运行实例的联网权限。

## 识别范围与限制

支持归并到 30 类：狗、猫、兔子、仓鼠、马、牛、绵羊、猪、鸡、鸭、鹅、大熊猫、老虎、狮子、大象、斑马、猴子、熊、狐狸、狼、鳄鱼、松鼠、刺猬、企鹅、鹦鹉、猫头鹰、龟、青蛙、蛇、金鱼。

使用 ImageNet 通用图片分类模型，并非专门训练的 30 类动物模型。部分动物只覆盖模型中的代表外观，例如马对应 sorrel（栗色马）、牛对应 ox（牛）。这些归并存在明显局限，不保证覆盖全部品种，不能用于严谨的物种鉴定。狗和猫的不同品种分数会合并；页面显示原始模型分数的合计，不代表经过校准的正确概率。

单张照片适合包含一只清晰动物。总支持分数低于 20% 时拒绝给出结论；低于 50% 时提示不确定。模型可能仍会误判，尤其是照片中没有动物、存在多个主体或类别不在覆盖范围内时。请勿依据识别结果接近、触碰或喂食野生动物。

## 验证记录

- 自动测试覆盖类别数量、常见品种归并、不支持类别过滤、分数汇总。
- 生产构建通过。
- Chromium 验证图鉴筛选、详情、图片上传和手机布局。
- Chromium 实测：从公开模型地址下载量化模型，在 Web Worker 中完成推理，将官方示例中的真实猫照片识别为猫，模型分数 99%。云端浏览器使用系统已信任的代理 CA 完成 TLS 校验，未禁用证书验证。
- 首版错误的模型地址已替换为 Transformers.js 官方示例模型 `Xenova/vit-base-patch16-224`；无需 Hugging Face 账号或访问令牌。

## Windows 单文件桌面版（使用者无需 Node.js）

面向 Windows 10/11 64 位系统，便携式 EXE 内置 Electron 运行环境。下载并解压 GitHub Actions 产物后，双击 `AnimalLens-1.0.0-Windows-x64.exe` 即可；不必启动 CMD、安装 Node.js 或 npm 依赖。

首次启动需要少量时间将运行环境释放到系统临时目录。应用关闭时本地服务也会退出。首次识别仍需联网下载公开的 ViT 量化模型，不是完全离线版本。模型浏览器缓存保存在用户配置目录；程序会尽量复用本地端口以保留缓存。若端口被其他程序占用，将改用新端口，可能需要重新下载模型。

### 下载 EXE

1. 打开仓库的 **Actions** 页，选择 **Build Windows EXE**。
2. 打开最近一次绿色成功的运行记录。
3. 在 **Artifacts** 中下载 `AnimalLens-Windows-x64`（需要登录有仓库访问权限的 GitHub 账号）。
4. 解压 ZIP，然后双击其中的 EXE。不要直接在 ZIP 内运行。

工作流失败时不会产生可交付 EXE，请查看失败步骤；保存工作流并不代表 GitHub 构建已成功。自动打包产物默认保留 90 天，可通过 **Run workflow** 重新生成。

### 开发者自行打包

只有制作 EXE 的电脑需要 Node.js。使用 Windows 或受支持的交叉构建环境：

```sh
npm ci --ignore-scripts
npm test
npm run desktop:package
```

输出为 `release/AnimalLens-1.0.0-Windows-x64.exe`。`node_modules` 和 `release` 不提交到 Git。`electron-builder` 会自行下载并校验 Electron；普通浏览器开发不需要下载它。

桌面程序使用随机初始端口且仅监听 `127.0.0.1`，保留沙箱、上下文隔离，禁用渲染页面的 Node.js 集成。未配置发布者签名；构建不等于完成 Windows 真机验证，提交作业前请在 Windows 上实际测试上传与识别。

桌面服务的生产构建已在 Chromium 验证真实猫照片识别；本地交叉打包已生成 Windows PE 格式 EXE。Windows 真机的启动与模型下载仍需使用者检查。

### 作业提交建议

建议提交 `源码/`（排除 `.git`、`node_modules`、`release`）、`可执行程序/AnimalLens-1.0.0-Windows-x64.exe`、本说明，以及真实动物识别的演示截图。向老师注明首次识别需要联网。
