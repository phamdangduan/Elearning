package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.response.InstructorStatsResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.InstructorStatsService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/instructor/stats")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class InstructorStatsController {

    InstructorStatsService instructorStatsService;

    @GetMapping
    public ApiResponse<InstructorStatsResponse> getInstructorStats(
            @RequestParam String instructorId
    ) {
        return ApiResponse.ok(
                instructorStatsService.getInstructorStats(instructorId),
                SuccessCode.GET_INSTRUCTOR_STATS_SUCCESS
        );
    }
}
