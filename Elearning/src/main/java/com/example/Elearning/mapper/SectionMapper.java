package com.example.Elearning.mapper;

import com.example.Elearning.dto.request.CreatedSectionRequest;
import com.example.Elearning.dto.request.UpdateSectionRequest;
import com.example.Elearning.dto.response.CreatedSectionResponse;
import com.example.Elearning.dto.response.SectionResponse;
import com.example.Elearning.entity.Section;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SectionMapper {
    Section toEntity(CreatedSectionRequest createdSectionRequest);

    CreatedSectionResponse toResponse(Section section);

    void updateEntity(@MappingTarget Section section, UpdateSectionRequest request);

    @Mapping(target = "lessons", source = "lessons")
    @Mapping(target = "oderIndex", source = "orderIndex")
    SectionResponse toSectionResponse(Section section);
}