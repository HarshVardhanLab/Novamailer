from jinja2 import Template, TemplateError
import logging

def render_template(content: str, context: dict) -> str:
    if not content:
        return ""
    try:
        template = Template(content)
        return template.render(context)
    except TemplateError as e:
        logging.warning(f"Jinja template error: {e}. Falling back to basic string replacement.")
        # Fallback to simple replace for known variables in context
        rendered = content
        for key, value in context.items():
            rendered = rendered.replace(f"{{{{{key}}}}}", str(value))
            rendered = rendered.replace(f"{{{{ {key} }}}}", str(value))
        return rendered
