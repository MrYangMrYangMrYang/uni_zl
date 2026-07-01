# 知了论坛 H5 端 Docker 部署
# 使用多阶段构建：构建阶段 → 运行阶段，最终镜像仅含静态文件 + Nginx

# ========== 阶段一：构建 ==========
FROM node:18-alpine AS builder

WORKDIR /app

# 利用 Docker 缓存层：先复制依赖文件
COPY package.json package-lock.json ./

# 安装依赖（使用 npm ci 确保可复现构建）
RUN npm ci --production=false

# 复制源码并构建
COPY . .
RUN npm run build:h5

# ========== 阶段二：运行 ==========
FROM nginx:alpine

# 复制构建产物到 Nginx 静态目录
COPY --from=builder /app/dist/build/h5 /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
