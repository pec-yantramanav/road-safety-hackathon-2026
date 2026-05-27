package com.roadwatch.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class CrmCoreApplication {
    public static void main(String[] args) {
        SpringApplication.run(CrmCoreApplication.class, args);
    }
}
