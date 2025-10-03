from django.db import models
from martor.models import MartorField
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator

def validate_markdown_length(value):
    if len(value.split()) > 3000:
        raise ValidationError("Content must be less than 3000 words")
# Create your models here.
class HistoryNode(models.Model):
    title = models.CharField(max_length=255)
    con = models.TextField()
    ref = models.JSONField(default=list, blank=True)
    time = models.IntegerField(
        default=0,
        blank=True,
        validators=[MinValueValidator(-9999), MaxValueValidator(99999999)]
    )
    time_name = models.CharField(max_length=100, blank=True)
    field = models.CharField(max_length=100, blank=True)
    theme = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    tag = models.CharField(max_length=50, blank=True)
    details = MartorField(
        verbose_name="History Details",
        help_text="Write a new page in Markdown",
        blank=True,
        null=True,
        max_length=3000,
        validators=[validate_markdown_length]
    )
    cover = models.ImageField(upload_to='images/', blank=True, null=True)
    oridoc = models.FileField(upload_to='uploads/', blank=True, null=True)
    mkdoc = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Contributor(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    node = models.ForeignKey(HistoryNode, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name