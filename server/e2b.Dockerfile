FROM e2bdev/code-interpreter:latest

WORKDIR /home/user/app

RUN npm create vite@latest . -- --template react-ts && \
    npm install

RUN echo "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    host: true,\n    allowedHosts: true\n  }\n})" > vite.config.ts
