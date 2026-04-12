package com.example.Elearning.service;

import com.example.Elearning.dto.response.StudentStatsResponse;

public interface StudentStatsService {
    StudentStatsResponse getStudentStats(String studentId);
}
