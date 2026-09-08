package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.service.impl.PhotoStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;


@RestController
@RequestMapping(value = "v1/photos")
@CrossOrigin
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoStorageService photoStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> upload(@RequestParam("file") MultipartFile file) {
        String storedFileName = photoStorageService.store(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CommonResponse(ResponseCode.OPERATION_SUCCESS, Map.of("fileName", storedFileName), "Photo uploaded successfully"));
    }

    @GetMapping(value = "/{fileName}")
    public ResponseEntity<byte[]> get(@PathVariable String fileName) {
        Map.Entry<byte[], String> loaded = photoStorageService.load(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(loaded.getValue()))
                .body(loaded.getKey());
    }
}
