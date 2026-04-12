package com.example.Elearning.service;

import com.example.Elearning.dto.response.InstructorStatsResponse;

public interface InstructorStatsService {
    InstructorStatsResponse getInstructorStats(String instructorId);
}
