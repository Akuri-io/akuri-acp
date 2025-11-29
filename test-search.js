const { Test } = require('@nestjs/testing');
const { LibrarianService } = require('./dist/akuri-core/librarian/librarian.service');
const { PathsService } = require('./dist/paths/paths.service');
const { LoggerService } = require('./dist/common/logger/logger.service');
const { ConfigService } = require('@nestjs/config');

async function testSearch() {
  console.log('🧪 Testing LibrarianService search functionality...\n');

  // Create mock services
  const mockPathsService = {
    loadPaths: async () => [
      { id: 'env-akuri', path: '/mnt/0e67f549-8f2b-4fee-92ea-605bc0fd16ea/MULTIROOT/AKURI', isActive: true },
      { id: 'env-docs-extra', path: '/mnt/0e67f549-8f2b-4fee-92ea-605bc0fd16ea/MULTIROOT/DOCS-EXTRA', isActive: true },
      { id: 'dynamic-1', path: '/mnt/0e67f549-8f2b-4fee-92ea-605bc0fd16ea/AVATAR/INVESNETWORK/03-REPOS/INVESNETWORK-WORKSPACE/abc-zcode/rules', isActive: true }
    ]
  };

  const mockConfigService = {
    get: (key) => {
      if (key === 'AKURI_DOCS_PATH') {
        return '/mnt/0e67f549-8f2b-4fee-92ea-605bc0fd16ea/MULTIROOT/AKURI,/mnt/0e67f549-8f2b-4fee-92ea-605bc0fd16ea/MULTIROOT/DOCS-EXTRA';
      }
      return null;
    }
  };

  const mockLoggerService = {
    setContext: () => {},
    info: () => {},
    error: () => {},
    warn: () => {},
    logSearch: () => {}
  };

  // Create testing module
  const moduleRef = await Test.createTestingModule({
    providers: [
      LibrarianService,
      {
        provide: PathsService,
        useValue: mockPathsService
      },
      {
        provide: ConfigService,
        useValue: mockConfigService
      },
      LoggerService
    ],
  }).compile();

  const librarianService = moduleRef.get(LibrarianService);

  try {
    // Initialize the service manually (since onModuleInit won't be called in test)
    await librarianService['loadAllPaths']();

    // Test getDocsPaths method
    console.log('📂 Testing getDocsPaths():');
    const paths = librarianService.getDocsPaths();
    console.log('Paths found:', paths.length);
    paths.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path}`);
    });

    // Initialize DB and scan documents
    librarianService['initDB']();
    await librarianService['initialScan']();

    // Test search functionality
    console.log('\n🔍 Testing searchDocs() with query "carpetas":');
    const results = await librarianService.searchDocs('carpetas', 5);
    console.log(`Found ${results.length} results:`);
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.path} (score: ${result.score})`);
      if (result.snippet) {
        console.log(`     "${result.snippet.substring(0, 100)}..."`);
      }
    });

    console.log('\n✅ Search test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testSearch().catch(console.error);