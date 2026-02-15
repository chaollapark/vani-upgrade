<?php
declare(strict_types=1);

namespace MediaWiki\Extension\ImportArticles;

use ApiBase;
use CommentStoreComment;
use ContentHandler;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;
use MediaWiki\Permissions\Authority;
use Title;
use WikiPage;

class ApiCreatePages extends ApiBase {

  private $sourceDir;

  public function __construct($query, $moduleName) {
    parent::__construct($query, $moduleName);
    $this->sourceDir = '/var/www/vanitest/articles';
  }

  // Must be public for CSRF token handling
  public function needsToken() {
    return 'csrf';
  }

  // Required for write-mode APIs
  public function isWriteMode() {
    return true;
  }

  // Ensure POST-only
  public function mustBePosted() {
    return true;
  }

  // Example usage message for the API
  public function getExamplesMessages() {
    return [
      'action=importarticles-createpages&files=["Example.txt"]'
        => 'Create pages from Example.txt'
    ];
  }

  protected function getAllowedParams() {
    return [
      'files' => [
        self::PARAM_TYPE => 'string',
        self::PARAM_REQUIRED => true,
      ],
    ];
  }

  public function execute() {
    try {
      $authority = $this->getAuthority();

      // Permission check
      if (!$authority->isAllowed('edit') || !$authority->isAllowed('createpage')) {
        $this->dieWithError('You do not have permission to create pages', 'permissiondenied');
      }

      $files = json_decode($this->getParameter('files'), true);
      if (!is_array($files)) {
        $this->dieWithError('Invalid file list');
      }

      $results = [];
      foreach ($files as $file) {
        $results[$file] = $this->createPageFromFile($file, $authority);
      }

      $this->getResult()->addValue(null, 'results', $results);
    } catch (\Throwable $e) {
      $this->dieWithError(get_class($e) . ': ' . $e->getMessage());
    }
  }

  private function createPageFromFile($file, Authority $authority) {
    // Prevent directory traversal
    if (!preg_match('/^[A-Za-z0-9._-]+$/', $file)) {
      return 'invalid filename';
    }

    $path = rtrim($this->sourceDir, '/') . '/' . $file;
    if (!is_file($path) || !is_readable($path)) {
      return 'file not readable';
    }

    $rawText = file_get_contents($path);
    if ($rawText === false) {
      return 'read error';
    }

    $titleText = pathinfo($file, PATHINFO_FILENAME);
    $title = Title::newFromText($titleText);
    if (!$title) {
      return 'invalid title';
    }

    if ($title->exists()) {
      return 'page exists';
    }

    $content = ContentHandler::makeContent(
      $this->parseFileContents($rawText),
      $title,
      CONTENT_MODEL_WIKITEXT
    );

    $page = MediaWikiServices::getInstance()
      ->getWikiPageFactory()
      ->newFromTitle($title);

    $updater = $page->newPageUpdater($authority);

    try {
      $updater->setContent(SlotRecord::MAIN, $content);
      $updater->saveRevision(CommentStoreComment::newUnsavedComment("Imported from file $file"));
      return 'created';
    } catch (\Throwable $e) {
      return 'Revision error: ' . $e->getMessage();
    }
  }

  private function parseFileContents($text) {
    // Customize this to parse your file format
    return trim($text);
  }
}
