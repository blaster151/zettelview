#!/usr/bin/env node

import { Command } from 'commander';
import { smartBlocksService } from '../services/smartBlocksService';
import { loggingService } from '../services/loggingService';
import { notificationService } from '../services/notificationService';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('zett')
  .description('Smart Blocks CLI - Manage and process smart blocks in your notes')
  .version('1.0.0');

// Parse blocks from a markdown file
program
  .command('parse')
  .description('Parse smart blocks from a markdown file')
  .argument('<file>', 'Markdown file to parse')
  .option('-o, --output <file>', 'Output file for parsed blocks (JSON)')
  .option('-v, --verbose', 'Verbose output')
  .action(async (file, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = smartBlocksService.parseBlocks(content);
      
      if (options.verbose) {
        console.log(`Found ${blocks.length} smart blocks in ${file}:`);
        blocks.forEach((block, index) => {
          console.log(`\n${index + 1}. ${block.type.toUpperCase()} - ${block.title || 'Untitled'}`);
          console.log(`   ID: ${block.id}`);
          console.log(`   Tags: ${block.tags.join(', ') || 'none'}`);
          console.log(`   Reorderable: ${block.reorderable ? 'Yes' : 'No'}`);
          console.log(`   Content: ${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}`);
        });
      } else {
        console.log(`Found ${blocks.length} smart blocks`);
      }

      if (options.output) {
        const output = {
          file,
          blocks,
          metadata: {
            totalBlocks: blocks.length,
            blocksByType: blocks.reduce((acc, block) => {
              acc[block.type] = (acc[block.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            parsedAt: new Date().toISOString()
          }
        };
        
        fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
        console.log(`Output written to ${options.output}`);
      }
    } catch (error) {
      console.error('Error parsing blocks:', error);
      process.exit(1);
    }
  });

// Extract blocks to separate files
program
  .command('extract')
  .description('Extract smart blocks to separate note files')
  .argument('<file>', 'Markdown file containing blocks')
  .option('-o, --output-dir <dir>', 'Output directory for extracted notes', './extracted')
  .option('-f, --format <format>', 'Output format (markdown, json)', 'markdown')
  .option('--create-backlink', 'Create backlinks to original note')
  .option('--inherit-tags', 'Inherit tags from blocks')
  .option('--add-source', 'Add source reference to extracted notes')
  .action(async (file, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = smartBlocksService.parseBlocks(content);
      
      if (blocks.length === 0) {
        console.log('No smart blocks found to extract');
        return;
      }

      // Create output directory
      if (!fs.existsSync(options.outputDir)) {
        fs.mkdirSync(options.outputDir, { recursive: true });
      }

      console.log(`Extracting ${blocks.length} blocks to ${options.outputDir}...`);

      for (const block of blocks) {
        const extractedNote = await smartBlocksService.extractBlock(block, {
          createBacklink: options.createBacklink,
          inheritTags: options.inheritTags,
          addSourceReference: options.addSource
        });

        const filename = `${block.id}.${options.format === 'json' ? 'json' : 'md'}`;
        const filepath = path.join(options.outputDir, filename);

        if (options.format === 'json') {
          const jsonOutput = {
            id: extractedNote.id,
            title: extractedNote.title,
            body: extractedNote.body,
            tags: extractedNote.tags,
            sourceBlock: {
              id: block.id,
              type: block.type,
              originalFile: file
            },
            extractedAt: new Date().toISOString()
          };
          fs.writeFileSync(filepath, JSON.stringify(jsonOutput, null, 2));
        } else {
          fs.writeFileSync(filepath, extractedNote.body);
        }

        console.log(`✓ Extracted: ${filename}`);
      }

      console.log(`\nExtraction complete! ${blocks.length} blocks extracted to ${options.outputDir}`);
    } catch (error) {
      console.error('Error extracting blocks:', error);
      process.exit(1);
    }
  });

// Summarize blocks with AI
program
  .command('summarize')
  .description('Summarize smart blocks using AI')
  .argument('<file>', 'Markdown file containing blocks')
  .option('-o, --output <file>', 'Output file for summaries (JSON)')
  .option('-m, --model <model>', 'AI model to use', 'gpt-3.5-turbo')
  .option('-l, --max-length <length>', 'Maximum summary length', '150')
  .option('-s, --style <style>', 'Summary style (concise, detailed, bullet-points)', 'concise')
  .option('--include-context', 'Include context from surrounding blocks')
  .action(async (file, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = smartBlocksService.parseBlocks(content);
      
      if (blocks.length === 0) {
        console.log('No smart blocks found to summarize');
        return;
      }

      console.log(`Summarizing ${blocks.length} blocks...`);

      const summaries: Array<{
        blockId: string;
        blockType: string;
        originalContent: string;
        summary: string;
        model: string;
        timestamp: string;
      }> = [];

      for (const block of blocks) {
        try {
          console.log(`Summarizing block: ${block.id} (${block.type})`);
          
          const summary = await smartBlocksService.summarizeBlock(block, {
            model: options.model as any,
            maxLength: parseInt(options.maxLength),
            style: options.style as any,
            includeContext: options.includeContext
          });

          summaries.push({
            blockId: block.id,
            blockType: block.type,
            originalContent: block.content,
            summary,
            model: options.model,
            timestamp: new Date().toISOString()
          });

          console.log(`✓ Summarized: ${block.id}`);
        } catch (error) {
          console.error(`✗ Failed to summarize block ${block.id}:`, error);
        }
      }

      if (options.output) {
        const output = {
          file,
          summaries,
          metadata: {
            totalBlocks: blocks.length,
            summarizedBlocks: summaries.length,
            model: options.model,
            summarizedAt: new Date().toISOString()
          }
        };
        
        fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
        console.log(`\nSummaries written to ${options.output}`);
      } else {
        console.log('\nSummaries:');
        summaries.forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.blockType.toUpperCase()} - ${item.blockId}`);
          console.log(`   Summary: ${item.summary}`);
        });
      }
    } catch (error) {
      console.error('Error summarizing blocks:', error);
      process.exit(1);
    }
  });

// Reorder blocks
program
  .command('reorder')
  .description('Suggest reordering for smart blocks')
  .argument('<file>', 'Markdown file containing blocks')
  .option('-a, --algorithm <algorithm>', 'Reordering algorithm (similarity, chronological, importance)', 'similarity')
  .option('--apply', 'Apply reordering suggestions to file')
  .option('-o, --output <file>', 'Output file for reordered content')
  .action(async (file, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = smartBlocksService.parseBlocks(content);
      
      const reorderableBlocks = blocks.filter(b => b.reorderable);
      
      if (reorderableBlocks.length < 2) {
        console.log('Not enough reorderable blocks found (need at least 2)');
        return;
      }

      console.log(`Suggesting reorder for ${reorderableBlocks.length} reorderable blocks...`);

      const suggestions = await smartBlocksService.suggestReorder(blocks, {
        algorithm: options.algorithm as any,
        preserveIds: true,
        updateMetadata: true
      });

      console.log('\nReorder suggestions:');
      suggestions.forEach((newIndex, currentIndex) => {
        const block = blocks[currentIndex];
        const targetBlock = blocks[newIndex];
        if (block && targetBlock) {
          console.log(`${currentIndex + 1}. ${block.type} (${block.id}) → Position ${newIndex + 1}`);
        }
      });

      if (options.apply) {
        // Apply reordering by updating the file
        const reorderedContent = smartBlocksService.generateMarkdown(blocks, content);
        const outputFile = options.output || file;
        fs.writeFileSync(outputFile, reorderedContent);
        console.log(`\nReordering applied to ${outputFile}`);
      }
    } catch (error) {
      console.error('Error reordering blocks:', error);
      process.exit(1);
    }
  });

// Process blocks with AI
program
  .command('process')
  .description('Process smart blocks with AI operations')
  .argument('<file>', 'Markdown file containing blocks')
  .option('-o, --operations <operations>', 'Comma-separated list of operations (summarize,embed,reorder,extract)', 'summarize')
  .option('-b, --batch-size <size>', 'Batch size for processing', '5')
  .option('--output-dir <dir>', 'Output directory for processed results', './processed')
  .action(async (file, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = smartBlocksService.parseBlocks(content);
      
      if (blocks.length === 0) {
        console.log('No smart blocks found to process');
        return;
      }

      const operations = options.operations.split(',').map(op => op.trim());
      console.log(`Processing ${blocks.length} blocks with operations: ${operations.join(', ')}`);

      const jobs = await smartBlocksService.processBlocks(blocks, operations);

      // Create output directory
      if (!fs.existsSync(options.outputDir)) {
        fs.mkdirSync(options.outputDir, { recursive: true });
      }

      const results = {
        file,
        operations,
        jobs,
        metadata: {
          totalBlocks: blocks.length,
          processedJobs: jobs.length,
          processedAt: new Date().toISOString()
        }
      };

      const outputFile = path.join(options.outputDir, `${path.basename(file, '.md')}_processed.json`);
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

      console.log(`\nProcessing complete! Results written to ${outputFile}`);
      
      // Show summary
      const completedJobs = jobs.filter(job => job.status === 'completed');
      const failedJobs = jobs.filter(job => job.status === 'failed');
      
      console.log(`\nSummary:`);
      console.log(`  Completed: ${completedJobs.length}`);
      console.log(`  Failed: ${failedJobs.length}`);
      console.log(`  Pending: ${jobs.length - completedJobs.length - failedJobs.length}`);
    } catch (error) {
      console.error('Error processing blocks:', error);
      process.exit(1);
    }
  });

// Validate blocks
program
  .command('validate')
  .description('Validate smart blocks in a markdown file')
  .argument('<file>', 'Markdown file to validate')
  .option('-v, --verbose', 'Verbose output')
  .action(async (file) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = smartBlocksService.parseBlocks(content);
      
      console.log(`Validating ${blocks.length} blocks in ${file}...`);

      let validBlocks = 0;
      let invalidBlocks = 0;
      const errors: Array<{ blockId: string; errors: string[] }> = [];

      for (const block of blocks) {
        const validation = smartBlocksService.validateBlock(block);
        
        if (validation.isValid) {
          validBlocks++;
        } else {
          invalidBlocks++;
          errors.push({
            blockId: block.id,
            errors: validation.errors
          });
        }
      }

      console.log(`\nValidation Results:`);
      console.log(`  Valid blocks: ${validBlocks}`);
      console.log(`  Invalid blocks: ${invalidBlocks}`);
      console.log(`  Total blocks: ${blocks.length}`);

      if (invalidBlocks > 0) {
        console.log(`\nErrors found:`);
        errors.forEach(({ blockId, errors }) => {
          console.log(`  ${blockId}:`);
          errors.forEach(error => console.log(`    - ${error}`));
        });
        process.exit(1);
      } else {
        console.log(`\n✓ All blocks are valid!`);
      }
    } catch (error) {
      console.error('Error validating blocks:', error);
      process.exit(1);
    }
  });

// Statistics
program
  .command('stats')
  .description('Show statistics for smart blocks in a file')
  .argument('<file>', 'Markdown file to analyze')
  .option('-j, --json', 'Output in JSON format')
  .action(async (file) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = smartBlocksService.parseBlocks(content);
      
      const blocksByType = blocks.reduce((acc, block) => {
        acc[block.type] = (acc[block.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalLength = blocks.reduce((sum, block) => sum + block.content.length, 0);
      const averageLength = blocks.length > 0 ? totalLength / blocks.length : 0;

      const stats = {
        file,
        totalBlocks: blocks.length,
        blocksByType,
        averageBlockLength: Math.round(averageLength),
        reorderableBlocks: blocks.filter(b => b.reorderable).length,
        totalContentLength: totalLength,
        analyzedAt: new Date().toISOString()
      };

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(`Smart Blocks Statistics for ${file}:`);
        console.log(`  Total blocks: ${stats.totalBlocks}`);
        console.log(`  Average length: ${stats.averageBlockLength} characters`);
        console.log(`  Reorderable blocks: ${stats.reorderableBlocks}`);
        console.log(`  Total content: ${stats.totalContentLength} characters`);
        console.log(`\nBlocks by type:`);
        Object.entries(stats.blocksByType).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
      }
    } catch (error) {
      console.error('Error analyzing blocks:', error);
      process.exit(1);
    }
  });

// Help
program
  .command('help')
  .description('Show detailed help information')
  .action(() => {
    console.log(`
Smart Blocks CLI - Manage and process smart blocks in your notes

USAGE:
  zett <command> [options]

COMMANDS:
  parse <file>           Parse smart blocks from a markdown file
  extract <file>         Extract smart blocks to separate note files
  summarize <file>       Summarize smart blocks using AI
  reorder <file>         Suggest reordering for smart blocks
  process <file>         Process smart blocks with AI operations
  validate <file>        Validate smart blocks in a markdown file
  stats <file>           Show statistics for smart blocks in a file

EXAMPLES:
  zett parse my-note.md -v
  zett extract my-note.md -o ./extracted --create-backlink
  zett summarize my-note.md -m gpt-4 -l 200
  zett reorder my-note.md --apply
  zett process my-note.md -o summarize,embed
  zett validate my-note.md
  zett stats my-note.md --json

For more information about a command, run:
  zett <command> --help
    `);
  });

// Global error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  if (err.code === 'commander.help') {
    program.outputHelp();
  } else {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

export { program }; 