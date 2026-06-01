package com.jobmate.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobFilterRequest {
    private String location;
    private String experience;
    private String workMode;
    private String salary;
    private String jobType;
}
