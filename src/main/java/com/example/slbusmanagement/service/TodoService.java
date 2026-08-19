package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.TodoDTO;

import java.util.List;

public interface TodoService {
    List<TodoDTO> getAll();
    TodoDTO add(TodoDTO dto);
    TodoDTO update(Long id, TodoDTO dto);
    void delete(Long id);
}
