package com.example.slbusmanagement.controller;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.dto.ChatRequestDTO;
import com.example.slbusmanagement.dto.ChatResponseDTO;
import com.example.slbusmanagement.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping(value = "v1/chat")
@CrossOrigin
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('Owner','Manager')")
public class ChatController {

    private final ChatService chatService;

    @PostMapping(value = "/ask", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommonResponse> ask(@Valid @RequestBody ChatRequestDTO dto) {
        String reply = chatService.ask(dto.getMessage());
        return ResponseEntity.ok(new CommonResponse(ResponseCode.OPERATION_SUCCESS, new ChatResponseDTO(reply), "Chat reply"));
    }
}
