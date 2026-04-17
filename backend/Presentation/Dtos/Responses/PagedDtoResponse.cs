namespace Backend.Presentation.Dtos.Responses;

public class PagedDtoResponse<T>
{
    public IEnumerable<T> Items {get; set;} = [];
    public int TotalCount { get; set; }
}