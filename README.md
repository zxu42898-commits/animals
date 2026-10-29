# 森野识物 · Animal Lens

移动端友好的动物识别网页，支持上传、拖拽照片以及手机拍照，兼顾真实动物和卡通动物形象，提供 30 种动物图鉴。照片在浏览器内缩放并交由 Web Worker 本地推理，不上传到服务器。无需 API 密钥。

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

构建产物在 `dist/`，可部署到任意静态托管服务。首次识别需要从 Hugging Face 下载 `Xenova/clip-vit-base-patch32` 的量化模型；之后浏览器可以复用缓存，清理缓存后需要重新下载。模型服务不可达时会提示失败并允许重试，不返回虚构结果。

## 网络要求

- `huggingface.co`、`*.huggingface.co`、`*.hf.co`：模型配置与文件。
- `cdn.jsdelivr.net`：ONNX 运行时可能使用的资源。
- 安装依赖需要 `registry.npmjs.org`。

在限制联网的云环境中需在环境设置保存允许规则，再发布环境。保存草稿本身不会立刻改变运行实例的联网权限。

## 识别范围与限制

支持归并到 30 类：狗、猫、兔子、仓鼠、马、牛、绵羊、猪、鸡、鸭、鹅、大熊猫、老虎、狮子、大象、斑马、猴子、熊、狐狸、狼、鳄鱼、松鼠、刺猬、企鹅、鹦鹉、猫头鹰、龟、青蛙、蛇、金鱼。

使用 CLIP 零样本图文匹配模型，不再按 ImageNet 品种标签归并。每种动物使用数量相等的“真实照片”与“卡通/3D 动画形象”英文描述，同时比较人物、汽车、食物等物品以及长颈鹿、海豚等范围外动物。无需重新训练模型或 API 密钥。

识别的是形象对应的动物类别，例如卡通兔子对应“兔子”；不识别角色姓名，也不保证识别任意动漫形象。夸张造型、混合物种、多主体及不清晰图片可能无法确定。候选描述间的相对匹配分数不等于正确概率，不可用作准确率宣传。

相同动物的真实与卡通描述分数相加，不移除对照类别后重新归一化。如果对照类别排第一、最高分不足 35%，或前两类差距不足 10 个百分点，就拒绝给出结论；中等分数显示“可能是”。这些阈值是启发式规则，并不能保证拒绝所有范围外图片。

## 验证

```sh
npm test
npx playwright install chromium
npm run test:recognition
```

- 单元测试覆盖 30 类描述、真实/卡通分数汇总、非动物与范围外动物拒绝、不确定结果。
- 实际模型烟雾测试在 Chromium 中运行生产构建及桌面本地服务，依次检查真实猫照片、卡通兔子/狗/狐狸、汽车图片、范围外长颈鹿。结果与截图写入 `test-results/`。
- GitHub 的 Windows 自动构建先运行上述识别检查，通过后才上传 EXE，同时保存检查报告。
- 测试样例与来源见 `tests/fixtures/README.md`。少量样例通过不代表所有卡通都能识别，也不代表整体准确率。
- 首次识别或测试需联网下载 CLIP 的文本与图像量化模型，比旧的单图像分类模型下载量更大；缓存之后仍需要一定的推理时间。

## Windows 单文件桌面版（使用者无需 Node.js）

面向 Windows 10/11 64 位系统，便携式 EXE 内置 Electron 运行环境。下载并解压 GitHub Actions 产物后，双击 `AnimalLens-1.1.0-Windows-x64.exe` 即可；不必启动 CMD、安装 Node.js 或 npm 依赖。

首次启动需要少量时间将运行环境释放到系统临时目录。应用关闭时本地服务也会退出。首次识别仍需联网下载公开的 CLIP 量化模型，不是完全离线版本。模型浏览器缓存保存在用户配置目录；程序会尽量复用本地端口以保留缓存。若端口被其他程序占用，将改用新端口，可能需要重新下载模型。

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

输出为 `release/AnimalLens-1.1.0-Windows-x64.exe`。`node_modules` 和 `release` 不提交到 Git。`electron-builder` 会自行下载并校验 Electron；普通浏览器开发不需要下载它。

桌面程序使用随机初始端口且仅监听 `127.0.0.1`，保留沙箱、上下文隔离，禁用渲染页面的 Node.js 集成。未配置发布者签名；构建不等于完成 Windows 真机验证，提交作业前请在 Windows 上实际测试上传与识别。

浏览器模型检查与 Windows EXE 打包是不同的验证步骤；提交作业前请在自己的 Windows 电脑上检查启动、上传、真实照片及卡通图片识别。

### 作业提交建议

建议提交 `源码/`（排除 `.git`、`node_modules`、`release`）、`可执行程序/AnimalLens-1.1.0-Windows-x64.exe`、本说明，以及真实动物识别的演示截图。向老师注明首次识别需要联网。
