from jinja2 import Template

def render_template(content: str, context: dict) -> str:
    template = Template(content)
    return template.render(context)
