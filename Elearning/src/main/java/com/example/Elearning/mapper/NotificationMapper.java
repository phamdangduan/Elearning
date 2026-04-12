package com.example.Elearning.mapper;

import com.example.Elearning.dto.response.NotificationResponse;
import com.example.Elearning.entity.Notification;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    NotificationResponse toResponse(Notification entity);

    List<NotificationResponse> toResponseList(List<Notification> entities);
}
