"""
ChromaDB client for vector search operations.
Replaces pgvector for semantic car search functionality.
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import structlog

logger = structlog.get_logger()


class ChromaDBClient:
    """Manages ChromaDB collections for car embeddings and search history."""
    
    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize ChromaDB client with persistent storage.
        
        Args:
            persist_directory: Directory to persist ChromaDB data
        """
        self.client = chromadb.Client(Settings(
            persist_directory=persist_directory,
            anonymized_telemetry=False
        ))
        
        # Initialize collections
        self._init_collections()
        
        logger.info("ChromaDB client initialized", persist_dir=persist_directory)
    
    def _init_collections(self):
        """Create or get ChromaDB collections."""
        # Car embeddings collection
        self.cars_collection = self.client.get_or_create_collection(
            name="cars",
            metadata={"description": "Car inventory with semantic embeddings"}
        )
        
        # Search history collection (for preference learning)
        self.searches_collection = self.client.get_or_create_collection(
            name="searches",
            metadata={"description": "User search history with query embeddings"}
        )
        
        logger.info("ChromaDB collections initialized")
    
    def add_car(
        self, 
        car_id: int, 
        embedding: List[float], 
        metadata: Dict[str, Any]
    ) -> None:
        """
        Add a car embedding to the collection.
        
        Args:
            car_id: Unique car identifier
            embedding: 1536-dimensional embedding vector
            metadata: Car metadata (brand, model, price, etc.)
        """
        self.cars_collection.add(
            ids=[str(car_id)],
            embeddings=[embedding],
            metadatas=[metadata]
        )
        logger.debug("Car added to ChromaDB", car_id=car_id)
    
    def add_cars_batch(
        self,
        car_ids: List[int],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]]
    ) -> None:
        """
        Batch add multiple cars to the collection.
        
        Args:
            car_ids: List of car IDs
            embeddings: List of embedding vectors
            metadatas: List of car metadata dicts
        """
        self.cars_collection.add(
            ids=[str(cid) for cid in car_ids],
            embeddings=embeddings,
            metadatas=metadatas
        )
        logger.info("Cars batch added to ChromaDB", count=len(car_ids))
    
    def search_similar_cars(
        self,
        query_embedding: List[float],
        n_results: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Find similar cars using cosine similarity.
        
        Args:
            query_embedding: Query embedding vector
            n_results: Number of results to return
            filter_metadata: Optional metadata filters (e.g., {"price": {"$lt": 50000}})
        
        Returns:
            Dict with ids, distances, and metadatas
        """
        results = self.cars_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=filter_metadata
        )
        
        logger.info("Similar cars search completed", n_results=len(results['ids'][0]))
        return results
    
    def add_search(
        self,
        search_id: int,
        query_embedding: List[float],
        metadata: Dict[str, Any]
    ) -> None:
        """
        Add a search query embedding for preference learning.
        
        Args:
            search_id: Unique search identifier
            query_embedding: Query embedding vector
            metadata: Search metadata (user_id, query text, etc.)
        """
        self.searches_collection.add(
            ids=[str(search_id)],
            embeddings=[query_embedding],
            metadatas=[metadata]
        )
        logger.debug("Search added to ChromaDB", search_id=search_id)
    
    def get_car(self, car_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve a car by ID.
        
        Args:
            car_id: Car identifier
        
        Returns:
            Car data or None if not found
        """
        result = self.cars_collection.get(
            ids=[str(car_id)],
            include=["embeddings", "metadatas"]
        )
        
        if result['ids']:
            return {
                "id": result['ids'][0],
                "embedding": result['embeddings'][0],
                "metadata": result['metadatas'][0]
            }
        return None
    
    def delete_car(self, car_id: int) -> None:
        """
        Delete a car from the collection.
        
        Args:
            car_id: Car identifier to delete
        """
        self.cars_collection.delete(ids=[str(car_id)])
        logger.debug("Car deleted from ChromaDB", car_id=car_id)
    
    def count_cars(self) -> int:
        """Get total number of cars in collection."""
        return self.cars_collection.count()
    
    def reset_collections(self) -> None:
        """Delete and recreate all collections (use with caution)."""
        self.client.delete_collection("cars")
        self.client.delete_collection("searches")
        self._init_collections()
        logger.warning("ChromaDB collections reset")


# Singleton instance
_chroma_client: Optional[ChromaDBClient] = None


def get_chroma_client() -> ChromaDBClient:
    """Get or create ChromaDB client singleton."""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = ChromaDBClient()
    return _chroma_client
