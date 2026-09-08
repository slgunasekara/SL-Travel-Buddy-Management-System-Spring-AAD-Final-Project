package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;


@Service
@Slf4j
public class PhotoStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, "image/webp", MediaType.IMAGE_GIF_VALUE);

    private final Path uploadRoot;

    public PhotoStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + uploadRoot, e);
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "No file was uploaded.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new CustomException(ResponseCode.UNPROCESSABLE_ENTITY,
                    "Only JPEG, PNG, WEBP, or GIF images are allowed.");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";

        if (extension.contains("/") || extension.contains("\\") || extension.contains("..")) {
            extension = "";
        }
        String storedName = UUID.randomUUID() + extension;

        try {
            Path target = uploadRoot.resolve(storedName).normalize();
            if (!target.getParent().equals(uploadRoot)) {

                throw new CustomException(ResponseCode.BAD_REQUEST, "Invalid file name.");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored uploaded photo: {}", storedName);
            return storedName;
        } catch (IOException e) {
            log.error("Failed to store uploaded photo", e);
            throw new CustomException(ResponseCode.INTERNAL_SERVER_ERROR, "Failed to save the uploaded photo.");
        }
    }


    public Map.Entry<byte[], String> load(String fileName) {
        Path path = resolveSafely(fileName);
        if (!Files.exists(path)) {
            throw new CustomException(ResponseCode.NOT_FOUND);
        }
        try {
            byte[] bytes = Files.readAllBytes(path);
            String contentType = Files.probeContentType(path);
            if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            return Map.entry(bytes, contentType);
        } catch (IOException e) {
            log.error("Failed to read stored photo: {}", fileName, e);
            throw new CustomException(ResponseCode.INTERNAL_SERVER_ERROR, "Failed to read the stored photo.");
        }
    }

    public void deleteQuietly(String fileName) {
        if (fileName == null || fileName.isBlank()) return;
        try {
            Files.deleteIfExists(resolveSafely(fileName));
        } catch (Exception e) {
            log.warn("Could not delete orphaned photo file: {}", fileName, e);
        }
    }

    private Path resolveSafely(String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("/") || fileName.contains("\\") || fileName.contains("..")) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "Invalid file name.");
        }
        return uploadRoot.resolve(fileName).normalize();
    }
}
