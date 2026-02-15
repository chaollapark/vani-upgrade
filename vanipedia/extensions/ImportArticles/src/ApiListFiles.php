<?php

namespace MediaWiki\Extension\ImportArticles;

use ApiBase;

class ApiListFiles extends ApiBase {

    public function execute() {
        $files = $this->listFiles();
        $this->getResult()->addValue( null, 'files', $files );
    }

    protected function getAllowedParams() {
        return [];
    }

    public function isWriteMode() {
        return false;
    }

    /**
     * Safely scan the folder and return a list of files
     */
    private function listFiles(): array {
        $dir = '/var/www/vanipedia/articles'; // CHANGE THIS TO YOUR FOLDER
        $files = [];

        // Make sure directory exists and is readable
        if (!is_dir($dir)) {
            return ['ERROR: directory not found'];
        }

        $scanned = @scandir($dir); // suppress warnings
        if (!is_array($scanned)) {
            return ['ERROR: unable to read directory'];
        }

        foreach ($scanned as $file) {
            // skip '.' and '..'
            if ($file[0] === '.') continue;
            // only include files (not subdirectories)
            if (is_file($dir . '/' . $file)) {
                $files[] = $file;
            }
        }

        return $files;
    }
}
