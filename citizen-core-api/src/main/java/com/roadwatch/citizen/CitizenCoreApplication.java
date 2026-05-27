package com.roadwatch.citizen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class CitizenCoreApplication {
    public static void main(String[] args) {
        SpringApplication.run(CitizenCoreApplication.class, args);
    }
}
