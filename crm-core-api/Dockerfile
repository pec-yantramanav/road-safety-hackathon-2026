# Build stage
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN maven_opts="-XX:+TieredCompilation -XX:TieredStopAtLevel=1" mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/crm-core-api-*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
