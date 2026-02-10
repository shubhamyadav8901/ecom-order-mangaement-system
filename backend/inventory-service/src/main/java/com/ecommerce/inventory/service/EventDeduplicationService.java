package com.ecommerce.inventory.service;

import com.ecommerce.inventory.repository.ProcessedEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventDeduplicationService {

    @Autowired
    private ProcessedEventRepository processedEventRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = DataIntegrityViolationException.class)
    public boolean tryStartProcessing(String eventKey) {
        try {
            return processedEventRepository.insertIgnoreConflict(eventKey) > 0;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    @Transactional
    public void markFailed(String eventKey) {
        processedEventRepository.deleteByEventKey(eventKey);
    }
}
