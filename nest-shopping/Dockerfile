# Stage 1: Builder (빌드 단계)
# Node.js 20 + Alpine Linux 기반 이미지 사용
# - 빌드 작업(ts → js 변환, Nest build 등)을 여기서 수행
FROM node:20-alpine AS builder

# 컨테이너 안의 작업 경로를 /app으로 설정
WORKDIR /app

# package.json, package-lock.json 파일 복사
COPY package*.json ./

# 빌드 단계에서는 devDependencies까지 전부 설치
RUN npm install

# 프로젝트 전체 파일을 컨테이너로 복사
COPY . .

# NestJS 빌드 실행
RUN npm run build


# Stage 2: Runner (실행 단계)
# Node.js 20 + Alpine 기반 이미지 (실행 환경용)
# - devDependencies 없이 dist만 남긴 최종 실행 환경
FROM node:20-alpine AS runner

# 실행 스테이지에서도 작업 경로 /app 사용
WORKDIR /app

# package.json, package-lock.json 파일 복사
COPY package*.json ./

# 프로덕션용 dependencies만 설치
# - devDependencies는 설치되지 않음 → 이미지 크기 감소
RUN npm install --only=production

# 빌더 단계에서 생성한 dist 폴더만 가져오기
# - 즉, 소스 코드와 devDependencies 없이 실행 파일만 존재
COPY --from=builder /app/dist ./dist

# 컨테이너에서 사용하는 포트
EXPOSE 3000

# 컨테이너가 시작될 때 실행할 명령 (NestJS 서버 실행)
CMD [ "node", "dist/main.js" ]
