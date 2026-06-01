package com.jobmate.backend.service;

import com.jobmate.backend.entity.SkillsMaster;
import com.jobmate.backend.repository.SkillsMasterRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillsMasterSeeder {

    private final SkillsMasterRepository skillsMasterRepository;

    @PostConstruct
    @Transactional
    public void seedSkills() {
        if (skillsMasterRepository.count() >= 300) {
            log.info("skills_master table already seeded with {} skills. Skipping seeding.", skillsMasterRepository.count());
            return;
        }

        log.info("Seeding skills_master table with 300+ premium technical skills...");

        List<SkillInfo> skills = new ArrayList<>();

        // 1. Languages (35 skills)
        add(skills, "Java", "Programming Languages");
        add(skills, "Python", "Programming Languages");
        add(skills, "JavaScript", "Programming Languages");
        add(skills, "TypeScript", "Programming Languages");
        add(skills, "C", "Programming Languages");
        add(skills, "C++", "Programming Languages");
        add(skills, "C#", "Programming Languages");
        add(skills, "Go", "Programming Languages");
        add(skills, "Rust", "Programming Languages");
        add(skills, "Kotlin", "Programming Languages");
        add(skills, "Swift", "Programming Languages");
        add(skills, "PHP", "Programming Languages");
        add(skills, "Ruby", "Programming Languages");
        add(skills, "SQL", "Programming Languages");
        add(skills, "HTML", "Programming Languages");
        add(skills, "CSS", "Programming Languages");
        add(skills, "R", "Programming Languages");
        add(skills, "MATLAB", "Programming Languages");
        add(skills, "Scala", "Programming Languages");
        add(skills, "Dart", "Programming Languages");
        add(skills, "Perl", "Programming Languages");
        add(skills, "Objective-C", "Programming Languages");
        add(skills, "Shell Scripting", "Programming Languages");
        add(skills, "Bash", "Programming Languages");
        add(skills, "PowerShell", "Programming Languages");
        add(skills, "Haskell", "Programming Languages");
        add(skills, "Groovy", "Programming Languages");
        add(skills, "Julia", "Programming Languages");
        add(skills, "Lua", "Programming Languages");
        add(skills, "F#", "Programming Languages");
        add(skills, "Clojure", "Programming Languages");
        add(skills, "Elixir", "Programming Languages");
        add(skills, "Erlang", "Programming Languages");
        add(skills, "Solidity", "Programming Languages");
        add(skills, "Fortran", "Programming Languages");

        // 2. Frontend Technologies (40 skills)
        add(skills, "React", "Frontend Technologies");
        add(skills, "Angular", "Frontend Technologies");
        add(skills, "Vue", "Frontend Technologies");
        add(skills, "Next.js", "Frontend Technologies");
        add(skills, "Nuxt.js", "Frontend Technologies");
        add(skills, "Svelte", "Frontend Technologies");
        add(skills, "jQuery", "Frontend Technologies");
        add(skills, "Bootstrap", "Frontend Technologies");
        add(skills, "Tailwind CSS", "Frontend Technologies");
        add(skills, "Redux", "Frontend Technologies");
        add(skills, "Sass", "Frontend Technologies");
        add(skills, "Less", "Frontend Technologies");
        add(skills, "Webpack", "Frontend Technologies");
        add(skills, "Vite", "Frontend Technologies");
        add(skills, "Babel", "Frontend Technologies");
        add(skills, "HTML5", "Frontend Technologies");
        add(skills, "CSS3", "Frontend Technologies");
        add(skills, "Flexbox", "Frontend Technologies");
        add(skills, "CSS Grid", "Frontend Technologies");
        add(skills, "Redux Toolkit", "Frontend Technologies");
        add(skills, "MobX", "Frontend Technologies");
        add(skills, "Vuetify", "Frontend Technologies");
        add(skills, "Material UI", "Frontend Technologies");
        add(skills, "Chakra UI", "Frontend Technologies");
        add(skills, "Semantic UI", "Frontend Technologies");
        add(skills, "Ant Design", "Frontend Technologies");
        add(skills, "Gatsby", "Frontend Technologies");
        add(skills, "Ember.js", "Frontend Technologies");
        add(skills, "Backbone.js", "Frontend Technologies");
        add(skills, "Pug", "Frontend Technologies");
        add(skills, "WebComponents", "Frontend Technologies");
        add(skills, "RxJS", "Frontend Technologies");
        add(skills, "Three.js", "Frontend Technologies");
        add(skills, "D3.js", "Frontend Technologies");
        add(skills, "Remix", "Frontend Technologies");
        add(skills, "SolidJS", "Frontend Technologies");
        add(skills, "Bulma", "Frontend Technologies");
        add(skills, "Alpine.js", "Frontend Technologies");
        add(skills, "TailwindCSS", "Frontend Technologies");
        add(skills, "DOM Manipulation", "Frontend Technologies");

        // 3. Backend Technologies & Frameworks (45 skills)
        add(skills, "Spring Boot", "Backend Technologies");
        add(skills, "Spring Framework", "Backend Technologies");
        add(skills, "Hibernate", "Backend Technologies");
        add(skills, "Node.js", "Backend Technologies");
        add(skills, "Express.js", "Backend Technologies");
        add(skills, "Django", "Backend Technologies");
        add(skills, "Flask", "Backend Technologies");
        add(skills, "FastAPI", "Backend Technologies");
        add(skills, "Ruby on Rails", "Backend Technologies");
        add(skills, "Laravel", "Backend Technologies");
        add(skills, "ASP.NET Core", "Backend Technologies");
        add(skills, "NestJS", "Backend Technologies");
        add(skills, "Koa", "Backend Technologies");
        add(skills, "Spring MVC", "Backend Technologies");
        add(skills, "Spring Security", "Backend Technologies");
        add(skills, "Spring Data JPA", "Backend Technologies");
        add(skills, "JDBC", "Backend Technologies");
        add(skills, "EJB", "Backend Technologies");
        add(skills, "JSF", "Backend Technologies");
        add(skills, "Struts", "Backend Technologies");
        add(skills, "Express", "Backend Technologies");
        add(skills, "Hapi.js", "Backend Technologies");
        add(skills, "Fastify", "Backend Technologies");
        add(skills, "Gin", "Backend Technologies");
        add(skills, "Echo", "Backend Technologies");
        add(skills, "Fiber", "Backend Technologies");
        add(skills, "Symfony", "Backend Technologies");
        add(skills, "CodeIgniter", "Backend Technologies");
        add(skills, "Yii", "Backend Technologies");
        add(skills, "Zend", "Backend Technologies");
        add(skills, "Tornado", "Backend Technologies");
        add(skills, "Celery", "Backend Technologies");
        add(skills, "ActiveRecord", "Backend Technologies");
        add(skills, "Sequelize", "Backend Technologies");
        add(skills, "Mongoose", "Backend Technologies");
        add(skills, "Prisma", "Backend Technologies");
        add(skills, "TypeORM", "Backend Technologies");
        add(skills, "MyBatis", "Backend Technologies");
        add(skills, "Play Framework", "Backend Technologies");
        add(skills, "Akka", "Backend Technologies");
        add(skills, "Actix Web", "Backend Technologies");
        add(skills, "Phoenix Framework", "Backend Technologies");
        add(skills, "Meteor", "Backend Technologies");
        add(skills, "Strapi", "Backend Technologies");
        add(skills, "Spring Cloud", "Backend Technologies");

        // 4. Databases & Storage (35 skills)
        add(skills, "MySQL", "Databases & Storage");
        add(skills, "PostgreSQL", "Databases & Storage");
        add(skills, "MongoDB", "Databases & Storage");
        add(skills, "Oracle DB", "Databases & Storage");
        add(skills, "SQL Server", "Databases & Storage");
        add(skills, "SQLite", "Databases & Storage");
        add(skills, "Redis", "Databases & Storage");
        add(skills, "Cassandra", "Databases & Storage");
        add(skills, "DynamoDB", "Databases & Storage");
        add(skills, "MariaDB", "Databases & Storage");
        add(skills, "Neo4j", "Databases & Storage");
        add(skills, "Elasticsearch", "Databases & Storage");
        add(skills, "Firebase", "Databases & Storage");
        add(skills, "CouchDB", "Databases & Storage");
        add(skills, "HBase", "Databases & Storage");
        add(skills, "InfluxDB", "Databases & Storage");
        add(skills, "Memcached", "Databases & Storage");
        add(skills, "Realm", "Databases & Storage");
        add(skills, "RethinkDB", "Databases & Storage");
        add(skills, "CockroachDB", "Databases & Storage");
        add(skills, "TimescaleDB", "Databases & Storage");
        add(skills, "ClickHouse", "Databases & Storage");
        add(skills, "Hive", "Databases & Storage");
        add(skills, "HDFS", "Databases & Storage");
        add(skills, "MinIO", "Databases & Storage");
        add(skills, "AWS S3", "Databases & Storage");
        add(skills, "Dynamo", "Databases & Storage");
        add(skills, "Redshift", "Databases & Storage");
        add(skills, "Snowflake", "Databases & Storage");
        add(skills, "BigQuery", "Databases & Storage");
        add(skills, "Firebase Realtime Database", "Databases & Storage");
        add(skills, "Cloud Firestore", "Databases & Storage");
        add(skills, "GraphQL Databases", "Databases & Storage");
        add(skills, "NoSQL", "Databases & Storage");
        add(skills, "Relational Databases", "Databases & Storage");

        // 5. DevOps & Cloud Infrastructure (45 skills)
        add(skills, "Docker", "DevOps & Cloud");
        add(skills, "Kubernetes", "DevOps & Cloud");
        add(skills, "AWS", "DevOps & Cloud");
        add(skills, "Azure", "DevOps & Cloud");
        add(skills, "Google Cloud", "DevOps & Cloud");
        add(skills, "GCP", "DevOps & Cloud");
        add(skills, "Terraform", "DevOps & Cloud");
        add(skills, "Ansible", "DevOps & Cloud");
        add(skills, "Jenkins", "DevOps & Cloud");
        add(skills, "GitLab CI", "DevOps & Cloud");
        add(skills, "GitHub Actions", "DevOps & Cloud");
        add(skills, "Travis CI", "DevOps & Cloud");
        add(skills, "CircleCI", "DevOps & Cloud");
        add(skills, "Prometheus", "DevOps & Cloud");
        add(skills, "Grafana", "DevOps & Cloud");
        add(skills, "Nginx", "DevOps & Cloud");
        add(skills, "Apache HTTP Server", "DevOps & Cloud");
        add(skills, "Chef", "DevOps & Cloud");
        add(skills, "Puppet", "DevOps & Cloud");
        add(skills, "Vagrant", "DevOps & Cloud");
        add(skills, "Helm", "DevOps & Cloud");
        add(skills, "Istio", "DevOps & Cloud");
        add(skills, "AWS EC2", "DevOps & Cloud");
        add(skills, "AWS Lambda", "DevOps & Cloud");
        add(skills, "AWS RDS", "DevOps & Cloud");
        add(skills, "Azure DevOps", "DevOps & Cloud");
        add(skills, "Heroku", "DevOps & Cloud");
        add(skills, "DigitalOcean", "DevOps & Cloud");
        add(skills, "Cloudflare", "DevOps & Cloud");
        add(skills, "OpenStack", "DevOps & Cloud");
        add(skills, "Consul", "DevOps & Cloud");
        add(skills, "ELK Stack", "DevOps & Cloud");
        add(skills, "Datadog", "DevOps & Cloud");
        add(skills, "Splunk", "DevOps & Cloud");
        add(skills, "New Relic", "DevOps & Cloud");
        add(skills, "SonarQube", "DevOps & Cloud");
        add(skills, "VirtualBox", "DevOps & Cloud");
        add(skills, "VMware", "DevOps & Cloud");
        add(skills, "AWS ECS", "DevOps & Cloud");
        add(skills, "AWS EKS", "DevOps & Cloud");
        add(skills, "Serverless Framework", "DevOps & Cloud");
        add(skills, "OpenShift", "DevOps & Cloud");
        add(skills, "ArgoCD", "DevOps & Cloud");
        add(skills, "FluxCD", "DevOps & Cloud");
        add(skills, "AWS CloudFormation", "DevOps & Cloud");

        // 6. Mobile & Desktop Development (20 skills)
        add(skills, "Android Development", "Mobile & Desktop");
        add(skills, "iOS Development", "Mobile & Desktop");
        add(skills, "Flutter", "Mobile & Desktop");
        add(skills, "React Native", "Mobile & Desktop");
        add(skills, "Xamarin", "Mobile & Desktop");
        add(skills, "Ionic", "Mobile & Desktop");
        add(skills, "Cordova", "Mobile & Desktop");
        add(skills, "SwiftUI", "Mobile & Desktop");
        add(skills, "Jetpack Compose", "Mobile & Desktop");
        add(skills, "Electron", "Mobile & Desktop");
        add(skills, "Qt", "Mobile & Desktop");
        add(skills, "WPF", "Mobile & Desktop");
        add(skills, "WinForms", "Mobile & Desktop");
        add(skills, "Cocoa Touch", "Mobile & Desktop");
        add(skills, "NativeScript", "Mobile & Desktop");
        add(skills, "Android SDK", "Mobile & Desktop");
        add(skills, "Gradle Mobile", "Mobile & Desktop");
        add(skills, "Maui", "Mobile & Desktop");
        add(skills, "Capacitor", "Mobile & Desktop");
        add(skills, "Apple SDK", "Mobile & Desktop");

        // 7. Testing & Quality Assurance (25 skills)
        add(skills, "JUnit", "Testing & QA");
        add(skills, "TestNG", "Testing & QA");
        add(skills, "Mockito", "Testing & QA");
        add(skills, "Selenium", "Testing & QA");
        add(skills, "Cypress", "Testing & QA");
        add(skills, "Playwright", "Testing & QA");
        add(skills, "Jest", "Testing & QA");
        add(skills, "Mocha", "Testing & QA");
        add(skills, "Chai", "Testing & QA");
        add(skills, "PyTest", "Testing & QA");
        add(skills, "Cucumber", "Testing & QA");
        add(skills, "Jasmine", "Testing & QA");
        add(skills, "Karma", "Testing & QA");
        add(skills, "Postman", "Testing & QA");
        add(skills, "SoapUI", "Testing & QA");
        add(skills, "JMeter", "Testing & QA");
        add(skills, "Katalon Studio", "Testing & QA");
        add(skills, "Appium", "Testing & QA");
        add(skills, "Robot Framework", "Testing & QA");
        add(skills, "SonarLint", "Testing & QA");
        add(skills, "RestAssured", "Testing & QA");
        add(skills, "Enzyme", "Testing & QA");
        add(skills, "RSpec", "Testing & QA");
        add(skills, "NUnit", "Testing & QA");
        add(skills, "JUnit5", "Testing & QA");

        // 8. APIs, Integration & Architecture (35 skills)
        add(skills, "REST API", "APIs & Architecture");
        add(skills, "RESTful API", "APIs & Architecture");
        add(skills, "Microservices", "APIs & Architecture");
        add(skills, "GraphQL", "APIs & Architecture");
        add(skills, "WebSockets", "APIs & Architecture");
        add(skills, "gRPC", "APIs & Architecture");
        add(skills, "SOAP", "APIs & Architecture");
        add(skills, "Webhooks", "APIs & Architecture");
        add(skills, "Apache Kafka", "APIs & Architecture");
        add(skills, "RabbitMQ", "APIs & Architecture");
        add(skills, "ActiveMQ", "APIs & Architecture");
        add(skills, "JWT", "APIs & Architecture");
        add(skills, "OAuth 2.0", "APIs & Architecture");
        add(skills, "OAuth", "APIs & Architecture");
        add(skills, "SAML", "APIs & Architecture");
        add(skills, "Single Sign-On", "APIs & Architecture");
        add(skills, "SSO", "APIs & Architecture");
        add(skills, "Service Mesh", "APIs & Architecture");
        add(skills, "Event-Driven Architecture", "APIs & Architecture");
        add(skills, "Message Queues", "APIs & Architecture");
        add(skills, "API Gateway", "APIs & Architecture");
        add(skills, "Kong Gateway", "APIs & Architecture");
        add(skills, "Apigee", "APIs & Architecture");
        add(skills, "Zuul", "APIs & Architecture");
        add(skills, "JSON", "APIs & Architecture");
        add(skills, "XML", "APIs & Architecture");
        add(skills, "YAML", "APIs & Architecture");
        add(skills, "Protobuf", "APIs & Architecture");
        add(skills, "Auth0", "APIs & Architecture");
        add(skills, "Okta", "APIs & Architecture");
        add(skills, "Keycloak", "APIs & Architecture");
        add(skills, "CORS", "APIs & Architecture");
        add(skills, "RESTful", "APIs & Architecture");
        add(skills, "Web Services", "APIs & Architecture");
        add(skills, "Enterprise Integration", "APIs & Architecture");

        // 9. Tools & Utilities (25 skills)
        add(skills, "Git", "Tools & VCS");
        add(skills, "GitHub", "Tools & VCS");
        add(skills, "GitLab", "Tools & VCS");
        add(skills, "Bitbucket", "Tools & VCS");
        add(skills, "SVN", "Tools & VCS");
        add(skills, "Maven", "Tools & VCS");
        add(skills, "Gradle", "Tools & VCS");
        add(skills, "npm", "Tools & VCS");
        add(skills, "yarn", "Tools & VCS");
        add(skills, "pnpm", "Tools & VCS");
        add(skills, "Jira", "Tools & VCS");
        add(skills, "Confluence", "Tools & VCS");
        add(skills, "Trello", "Tools & VCS");
        add(skills, "Figma", "Tools & VCS");
        add(skills, "Docker Compose", "Tools & VCS");
        add(skills, "Kubectl", "Tools & VCS");
        add(skills, "VS Code", "Tools & VCS");
        add(skills, "IntelliJ IDEA", "Tools & VCS");
        add(skills, "Eclipse", "Tools & VCS");
        add(skills, "Android Studio", "Tools & VCS");
        add(skills, "Xcode", "Tools & VCS");
        add(skills, "Postman App", "Tools & VCS");
        add(skills, "Swagger", "Tools & VCS");
        add(skills, "OpenAPI", "Tools & VCS");
        add(skills, "Slack API", "Tools & VCS");

        // 10. AI, Machine Learning & Data Science (35 skills)
        add(skills, "TensorFlow", "AI & ML");
        add(skills, "PyTorch", "AI & ML");
        add(skills, "Keras", "AI & ML");
        add(skills, "Scikit-Learn", "AI & ML");
        add(skills, "Pandas", "AI & ML");
        add(skills, "NumPy", "AI & ML");
        add(skills, "Matplotlib", "AI & ML");
        add(skills, "Seaborn", "AI & ML");
        add(skills, "Scipy", "AI & ML");
        add(skills, "OpenCV", "AI & ML");
        add(skills, "Natural Language Processing", "AI & ML");
        add(skills, "NLP", "AI & ML");
        add(skills, "Computer Vision", "AI & ML");
        add(skills, "Deep Learning", "AI & ML");
        add(skills, "Machine Learning", "AI & ML");
        add(skills, "NLTK", "AI & ML");
        add(skills, "Spacy", "AI & ML");
        add(skills, "Hugging Face", "AI & ML");
        add(skills, "Tableau", "AI & ML");
        add(skills, "Power BI", "AI & ML");
        add(skills, "Data Mining", "AI & ML");
        add(skills, "Data Analytics", "AI & ML");
        add(skills, "LangChain", "AI & ML");
        add(skills, "LlamaIndex", "AI & ML");
        add(skills, "Vector Databases", "AI & ML");
        add(skills, "Pinecone", "AI & ML");
        add(skills, "ChromaDB", "AI & ML");
        add(skills, "Milvus", "AI & ML");
        add(skills, "Weaviate", "AI & ML");
        add(skills, "Generative AI", "AI & ML");
        add(skills, "Large Language Models", "AI & ML");
        add(skills, "LLM", "AI & ML");
        add(skills, "Spark", "AI & ML");
        add(skills, "PySpark", "AI & ML");
        add(skills, "Apache Spark", "AI & ML");

        // 11. Concepts, Methodologies & Architecture (30 skills)
        add(skills, "Data Structures", "Concepts & Architecture");
        add(skills, "Algorithms", "Concepts & Architecture");
        add(skills, "Object Oriented Programming", "Concepts & Architecture");
        add(skills, "OOP", "Concepts & Architecture");
        add(skills, "Design Patterns", "Concepts & Architecture");
        add(skills, "System Design", "Concepts & Architecture");
        add(skills, "Multithreading", "Concepts & Architecture");
        add(skills, "Concurrency", "Concepts & Architecture");
        add(skills, "Agile", "Concepts & Architecture");
        add(skills, "Scrum", "Concepts & Architecture");
        add(skills, "Kanban", "Concepts & Architecture");
        add(skills, "Test Driven Development", "Concepts & Architecture");
        add(skills, "TDD", "Concepts & Architecture");
        add(skills, "Behavior Driven Development", "Concepts & Architecture");
        add(skills, "BDD", "Concepts & Architecture");
        add(skills, "CI/CD", "Concepts & Architecture");
        add(skills, "Continuous Integration", "Concepts & Architecture");
        add(skills, "Continuous Delivery", "Concepts & Architecture");
        add(skills, "Domain Driven Design", "Concepts & Architecture");
        add(skills, "DDD", "Concepts & Architecture");
        add(skills, "MVC", "Concepts & Architecture");
        add(skills, "Clean Code", "Concepts & Architecture");
        add(skills, "SOLID Principles", "Concepts & Architecture");
        add(skills, "Refactoring", "Concepts & Architecture");
        add(skills, "DSA", "Concepts & Architecture");
        add(skills, "DBMS", "Concepts & Architecture");
        add(skills, "Database Management", "Concepts & Architecture");
        add(skills, "Operating Systems", "Concepts & Architecture");
        add(skills, "Computer Networks", "Concepts & Architecture");
        add(skills, "Cloud Native", "Concepts & Architecture");

        List<SkillsMaster> entities = new ArrayList<>();
        for (SkillInfo s : skills) {
            entities.add(SkillsMaster.builder()
                    .skillName(s.name)
                    .category(s.category)
                    .build());
        }

        skillsMasterRepository.saveAll(entities);
        log.info("Successfully seeded {} technical skills in skills_master!", entities.size());
    }

    private void add(List<SkillInfo> list, String name, String category) {
        list.add(new SkillInfo(name, category));
    }

    private static class SkillInfo {
        String name;
        String category;

        SkillInfo(String name, String category) {
            this.name = name;
            this.category = category;
        }
    }
}
