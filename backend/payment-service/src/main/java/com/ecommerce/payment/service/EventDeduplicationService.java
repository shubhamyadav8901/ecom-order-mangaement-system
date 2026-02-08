package com.ecommerce.payment.service;

import com.ecommerce.payment.repository.ProcessedEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventDeduplicationService {

    @Autowired
    private ProcessedEventRepository processedEventRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean tryStartProcessing(String eventKey) {
        return processedEventRepository.insertIgnoreConflict(eventKey) > 0;
    }

    @Transactional
    public void markFailed(String eventKey) {
        processedEventRepository.deleteByEventKey(eventKey);
    }
}
