package com.ecommerce.order.service;

import com.ecommerce.order.domain.ProcessedEvent;
import com.ecommerce.order.repository.ProcessedEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventDeduplicationService {

    @Autowired
    private ProcessedEventRepository processedEventRepository;

    @Transactional
    public boolean tryStartProcessing(String eventKey) {
        try {
            processedEventRepository.saveAndFlush(ProcessedEvent.builder().eventKey(eventKey).build());
            return true;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    @Transactional
    public void markFailed(String eventKey) {
        processedEventRepository.deleteByEventKey(eventKey);
    }
}
