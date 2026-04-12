package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.response.StudentStatsResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.StudentStatsService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student/stats")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StudentStatsController {

    StudentStatsService studentStatsService;

    @GetMapping
    public ApiResponse<StudentStatsResponse> getStudentStats(
            @RequestParam String studentId
    ) {
        return ApiResponse.ok(
                studentStatsService.getStudentStats(studentId),
                SuccessCode.GET_STUDENT_STATS_SUCCESS
        );
    }
}
