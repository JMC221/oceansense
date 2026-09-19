package com.startup1.oceansense;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
// Reminder: combines @Configuration, @EnableAutoConfiguration, @ComponentScan
// As explained in Week 20 slides, this boots the entire Spring context.

public class OceanSenseApp {

    public static void main(String[] args) {
        SpringApplication.run(OceanSenseApp.class, args);
    }

}
