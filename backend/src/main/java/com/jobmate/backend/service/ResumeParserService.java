package com.jobmate.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Service
@Slf4j
public class ResumeParserService {

    public String extractTextFromPdf(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new IOException("File does not exist: " + filePath);
        }
        try (PDDocument document = PDDocument.load(file)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            log.info("Successfully extracted text from PDF: {} chars", text.length());
            return text;
        }
    }

    public String extractTextFromDocx(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new IOException("File does not exist: " + filePath);
        }
        try (FileInputStream fis = new FileInputStream(file);
             XWPFDocument doc = new XWPFDocument(fis);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            String text = extractor.getText();
            log.info("Successfully extracted text from DOCX: {} chars", text.length());
            return text;
        }
    }

    public String extractResumeText(String filePath, String fileName) {
        String cleanName = fileName.toLowerCase();
        try {
            if (cleanName.endsWith(".pdf")) {
                return extractTextFromPdf(filePath);
            } else if (cleanName.endsWith(".docx") || cleanName.endsWith(".doc")) {
                return extractTextFromDocx(filePath);
            } else {
                log.warn("Unsupported file format: {}. Attempting POI DOCX parsing as fallback.", fileName);
                return extractTextFromDocx(filePath);
            }
        } catch (Exception e) {
            log.error("Failed to parse file text for {}: {}", fileName, e.getMessage(), e);
            return "";
        }
    }
}
