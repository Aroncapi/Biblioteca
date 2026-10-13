FROM node:22-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build:spring

FROM maven:3.9.12-eclipse-temurin-21 AS backend
WORKDIR /build
COPY pom.xml ./
COPY src/ ./src/
COPY --from=frontend /build/src/main/resources/static/ ./src/main/resources/static/
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN groupadd --system biblioteca && useradd --system --gid biblioteca biblioteca
COPY --from=backend /build/target/biblioteca-escolar-0.0.1-SNAPSHOT.jar ./app.jar
USER biblioteca
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65.0 -Djava.awt.headless=true"
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
