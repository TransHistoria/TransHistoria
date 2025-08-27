from django.shortcuts import render
# Create your views here.


def index_A(request):
    return render(request, 'test_index_A.html')

def timepoint(request, year):
    markdown_file = f'{year}.md'
    return render(request, 'detail.html', {'homepage': markdown_file})