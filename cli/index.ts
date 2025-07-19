#!/usr/bin/env node

import { Command } from 'commander';
import { fileManager, blockParser, summaryEngine } from '../core';
import * as path from 'path';

const program = new Command();

program
  .name('zett')
  .description('Zettelkasten CLI tool for managing smart blocks')
  .version('1.0.0');

// Parse command
program
  .command('parse <file>')
  .description('Parse smart blocks from a markdown file')
  .option('-o, --output <file>', 'Output file for parsed blocks')
  .option('-f, --format <format>', 'Output format (json, markdown)', 'json')
  .action(async (file, options) => {
    try {
      const { blocks, fileInfo } = await fileManager.readMarkdownFile(file);
      
      if (options.output) {
        if (options.format === 'json') {
          await fileManager.writeMarkdownFile(options.output, JSON.stringify(blocks, null, 2));
        } else {
          const markdownContent = blocks.map(block => 
            `${blockParser.generateBlockMarker(block)}\n${block.content}\n`
          ).join('\n');
          await fileManager.writeMarkdownFile(options.output, markdownContent);
        }
        console.log(`Parsed ${blocks.length} blocks to ${options.output}`);
      } else {
        console.log(`Found ${blocks.length} smart blocks in ${fileInfo.name}:`);
        blocks.forEach((block, index) => {
          console.log(`  ${index + 1}. ${block.id} (${block.type}) - ${block.content.substring(0, 50)}...`);
        });
      }
    } catch (error) {
      console.error(`Error parsing file: ${error}`);
      process.exit(1);
    }
  });

// Extract command
program
  .command('extract <file>')
  .description('Extract smart blocks from a markdown file')
  .option('-t, --type <type>', 'Filter by block type')
  .option('-m, --min-length <length>', 'Minimum content length', '10')
  .option('-M, --max-length <length>', 'Maximum content length')
  .option('-g, --tags <tags>', 'Comma-separated tags to filter by')
  .option('-o, --output <file>', 'Output file for extracted blocks')
  .action(async (file, options) => {
    try {
      const { content } = await fileManager.readMarkdownFile(file);
      
      const extractOptions = {
        type: options.type,
        minLength: parseInt(options.minLength),
        maxLength: options.maxLength ? parseInt(options.maxLength) : undefined,
        tags: options.tags ? options.tags.split(',').map(t => t.trim()) : undefined
      };

      const result = await summaryEngine.extractBlocks(content, extractOptions);
      
      if (options.output) {
        const extractedContent = result.extractedBlocks.map(block => 
          `${blockParser.generateBlockMarker(block)}\n${block.content}\n`
        ).join('\n');
        await fileManager.writeMarkdownFile(options.output, extractedContent);
        console.log(`Extracted ${result.extractedBlocks.length} blocks to ${options.output}`);
      } else {
        console.log(`Extracted ${result.extractedBlocks.length} blocks:`);
        result.extractedBlocks.forEach((block, index) => {
          console.log(`  ${index + 1}. ${block.id} (${block.type}) - ${block.content.substring(0, 50)}...`);
        });
      }
    } catch (error) {
      console.error(`Error extracting blocks: ${error}`);
      process.exit(1);
    }
  });

// Summarize command
program
  .command('summarize <file>')
  .description('Generate summaries for smart blocks in a file')
  .option('-b, --block <id>', 'Summarize specific block by ID')
  .option('-o, --output <file>', 'Output file for summaries')
  .action(async (file, options) => {
    try {
      const { blocks } = await fileManager.readMarkdownFile(file);
      
      if (options.block) {
        const block = blocks.find(b => b.id === options.block);
        if (!block) {
          console.error(`Block with ID ${options.block} not found`);
          process.exit(1);
        }
        
        const summary = await summaryEngine.generateSummary(block);
        if (summary.success) {
          console.log(`Summary for block ${block.id}:`);
          console.log(summary.data?.summary);
        } else {
          console.error(`Failed to generate summary: ${summary.error}`);
        }
      } else {
        const summaries: Array<{ blockId: string; summary?: string; confidence: number }> = [];
        for (const block of blocks) {
          const summary = await summaryEngine.generateSummary(block);
          if (summary.success) {
            summaries.push({
              blockId: block.id,
              summary: summary.data?.summary,
              confidence: summary.confidence
            });
          }
        }
        
        if (options.output) {
          await fileManager.writeMarkdownFile(options.output, JSON.stringify(summaries, null, 2));
          console.log(`Generated ${summaries.length} summaries to ${options.output}`);
        } else {
          console.log(`Generated ${summaries.length} summaries:`);
          summaries.forEach(s => {
            console.log(`  ${s.blockId}: ${s.summary?.substring(0, 100)}...`);
          });
        }
      }
    } catch (error) {
      console.error(`Error generating summaries: ${error}`);
      process.exit(1);
    }
  });

// Reorder command
program
  .command('reorder <file>')
  .description('Reorder smart blocks in a file based on AI suggestions')
  .option('-o, --output <file>', 'Output file for reordered content')
  .option('-p, --preview', 'Show reorder suggestions without applying')
  .action(async (file, options) => {
    try {
      const { blocks, content } = await fileManager.readMarkdownFile(file);
      
      if (options.preview) {
        const result = await summaryEngine.reorderBlocks(blocks);
        console.log('Reorder suggestions:');
        result.reorderSuggestions.forEach(suggestion => {
          console.log(`  Move block ${suggestion.blockId} to position ${suggestion.suggestedPosition}: ${suggestion.reason}`);
        });
      } else {
        const result = await summaryEngine.reorderBlocks(blocks);
        
        // Apply reordering to content
        let reorderedContent = content;
        for (const suggestion of result.reorderSuggestions) {
          const block = blocks.find(b => b.id === suggestion.blockId);
          if (block) {
            // Remove block from current position
            reorderedContent = blockParser.removeBlockFromMarkdown(reorderedContent, block.id);
            // Insert at new position
            reorderedContent = blockParser.insertBlockIntoMarkdown(reorderedContent, block, suggestion.suggestedPosition);
          }
        }
        
        if (options.output) {
          await fileManager.writeMarkdownFile(options.output, reorderedContent);
          console.log(`Reordered content saved to ${options.output}`);
        } else {
          console.log(reorderedContent);
        }
      }
    } catch (error) {
      console.error(`Error reordering blocks: ${error}`);
      process.exit(1);
    }
  });

// Process command
program
  .command('process <files...>')
  .description('Process multiple files with smart blocks')
  .option('-o, --operations <ops>', 'Comma-separated operations (summarize,embed,metadata)', 'summarize')
  .option('-d, --output-dir <dir>', 'Output directory for processed files')
  .action(async (files, options) => {
    try {
      const operations = options.operations.split(',').map(op => op.trim());
      const { files: processedFiles, stats } = await fileManager.processFiles(files);
      
      console.log(`Processing ${files.length} files...`);
      
      for (const file of processedFiles) {
        const batchResult = await summaryEngine.batchProcess(file.blocks, operations);
        
        if (options.outputDir) {
          const outputPath = path.join(options.outputDir, path.basename(file.path));
          await fileManager.writeMarkdownFile(outputPath, file.content);
        }
        
        console.log(`  ${path.basename(file.path)}: ${batchResult.stats.successful}/${batchResult.stats.total} operations successful`);
      }
      
      console.log(`\nProcessing complete:`);
      console.log(`  Total files: ${stats.totalFiles}`);
      console.log(`  Total blocks: ${stats.totalBlocks}`);
      console.log(`  Processing time: ${stats.processingTime}ms`);
      console.log(`  Errors: ${stats.errors}`);
    } catch (error) {
      console.error(`Error processing files: ${error}`);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate <file>')
  .description('Validate smart blocks in a file')
  .option('-s, --strict', 'Exit with error code if validation fails')
  .action(async (file, options) => {
    try {
      const { blocks } = await fileManager.readMarkdownFile(file);
      let hasErrors = false;
      
      console.log(`Validating ${blocks.length} blocks in ${file}...`);
      
      for (const block of blocks) {
        const validation = blockParser.validateBlock(block);
        if (!validation.isValid) {
          hasErrors = true;
          console.error(`  Block ${block.id}:`);
          validation.errors.forEach(error => {
            console.error(`    - ${error}`);
          });
        }
      }
      
      if (!hasErrors) {
        console.log('All blocks are valid!');
      } else if (options.strict) {
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error validating file: ${error}`);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats <file>')
  .description('Show statistics for a markdown file')
  .action(async (file) => {
    try {
      const { blocks, fileInfo } = await fileManager.readMarkdownFile(file);
      const stats = await fileManager.getFileStats(file);
      
      console.log(`File: ${fileInfo.name}`);
      console.log(`Size: ${stats.size} bytes`);
      console.log(`Lines: ${stats.lineCount}`);
      console.log(`Words: ${stats.wordCount}`);
      console.log(`Blocks: ${stats.blockCount}`);
      console.log(`Last modified: ${stats.lastModified}`);
      
      // Block type distribution
      const typeCounts: Record<string, number> = {};
      blocks.forEach(block => {
        typeCounts[block.type] = (typeCounts[block.type] || 0) + 1;
      });
      
      console.log('\nBlock types:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      // AI-generated blocks
      const aiBlocks = blocks.filter(b => b.aiGenerated);
      console.log(`\nAI-generated blocks: ${aiBlocks.length}`);
    } catch (error) {
      console.error(`Error getting stats: ${error}`);
      process.exit(1);
    }
  });

// Search command
program
  .command('search <directory> <term>')
  .description('Search for content in markdown files')
  .option('-c, --case-sensitive', 'Case-sensitive search')
  .action(async (directory, term, options) => {
    try {
      const results = await fileManager.searchFiles(directory, term);
      
      console.log(`Found ${results.length} files containing "${term}":`);
      
      for (const result of results) {
        console.log(`\n${path.basename(result.filePath)}:`);
        result.matches.forEach(match => {
          console.log(`  Line ${match.line}: ${match.content}`);
        });
      }
    } catch (error) {
      console.error(`Error searching: ${error}`);
      process.exit(1);
    }
  });

program.parse(); 