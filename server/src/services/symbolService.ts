import { EventEmitter } from 'events';
import { DocumentService } from './documentService';
import { AnalysisService } from './analysisService';
import {
  DocumentSymbolParams,
  CancellationToken,
  SymbolInformation,
  WorkspaceSymbolParams,
} from 'vscode-languageserver';
import { KsBaseSymbol } from '../analysis/types';
import { SymbolTable } from '../analysis/models/symbolTable';
import { toLangServerSymbols } from '../utilities/serverUtils';
import { notEmpty } from '../utilities/typeGuards';
import { flatten } from '../utilities/arrayUtils';
import { levenshteinDistance } from '../utilities/levenshtein';

export class SymbolService extends EventEmitter {
  /**
   * A logger for message and error logger
   */
  // private readonly logger: ILogger;

  /**
   * A tracer to follow where exceptions occur
   */
  // private readonly tracer: ITracer;

  /**
   * The document service to store and manage documents
   */
  private readonly documentService: DocumentService;

  /**
   * A service to provide analysis against scripts
   */
  private readonly analysisService: AnalysisService;

  /**
   * Construct a new completion service
   * @param logger A logger to log performance and exception
   * @param tracer a tracer to location exceptions
   * @param documentService The document service to load new files from disk
   * @param analysisService The analysis service for retrieving semantic document info
   */
  constructor(
    // logger: ILogger,
    // tracer: ITracer,
    documentService: DocumentService,
    analysisService: AnalysisService,
  ) {
    super();
    // this.logger = logger;
    // this.tracer = tracer;
    this.documentService = documentService;
    this.analysisService = analysisService;
  }

  /**
   * This handler provides document symbol capabilities. This provides a list of all
   * symbols that are located within a given document
   * @param documentSymbol the document to provide symbols for
   * @param cancellation request cancellation token
   */
  public async onDocumentSymbol(
    documentSymbol: DocumentSymbolParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<SymbolInformation[]>> {
    const { uri } = documentSymbol.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const entities = await this.loadAllTableSymbols(uri);
    return toLangServerSymbols(entities);
  }

  /**
   * This handler provides workspace symbol capabilities
   * @param workspaceSymbol workspace symbol params
   * @param cancellation cancellation token
   */
  public onWorkspaceSymbol(
    workspaceSymbol: WorkspaceSymbolParams,
    cancellation: CancellationToken,
  ): Maybe<SymbolInformation[]> {
    const query = workspaceSymbol.query.toLowerCase();

    // exit if cancel requested
    if (cancellation.isCancellationRequested || query.length < 2) {
      return undefined;
    }

    // retrieve all loaded symbols tables
    const symbolTables = this.documentService
      .getAllDocuments()
      .map(
        doc => this.analysisService.getInfo(doc.uri)?.semanticInfo.symbolTable,
      )
      .filter(notEmpty);

    // get all symbols
    const symbols = flatten(symbolTables.map(table => table.allSymbols()));
    const includeSymbols = symbols.filter((symbol) => symbol.name.lookup.includes(query));

    let symbolDistance: [KsBaseSymbol, number][] = symbols.map(symbol => [
      symbol,
      levenshteinDistance(query, symbol.name.lexeme.substr(0, query.length + 2)),
    ]);

    symbolDistance = symbolDistance.sort(
      ([, dist1], [, dist2]) => dist1 - dist2,
    );

    const end = symbolDistance.findIndex(([, dist]) => dist > 3);
    const topSymbols = symbolDistance
      .slice(0, end !== -1 ? end : 50)
      .map(([symbol]) => symbol);

    // sort each symbol by levenshtein distance to query
    const langSymbols = toLangServerSymbols([...new Set([...includeSymbols, ...topSymbols])]) ?? [];

    return langSymbols.filter((symbol) => symbol.name.length > (query.length - 1));
  }

  /**
   * Get or load a symbol table if it exists
   * @param uri document uri to load
   */
  private async loadSymbolTable(uri: string): Promise<Maybe<SymbolTable>> {
    return (await this.analysisService.loadInfo(uri))?.semanticInfo.symbolTable;
  }

  /**
   * Get a symbol table if it has already been loaded
   * @param uri document uri to get
   */
  private getSymbolTable(uri: string): Maybe<SymbolTable> {
    return this.analysisService.getInfo(uri)?.semanticInfo.symbolTable;
  }

  /**
   * load all symbols in a provided file
   * @param uri document uri
   */
  public async loadAllTableSymbols(uri: string): Promise<KsBaseSymbol[]> {
    return (await this.loadSymbolTable(uri))?.allSymbols() ?? [];
  }

  /**
   * Get all symbols in a provided file
   * @param uri document uri
   */
  public getAllTableSymbols(uri: string): KsBaseSymbol[] {
    return this.getSymbolTable(uri)?.allSymbols() ?? [];
  }
}
