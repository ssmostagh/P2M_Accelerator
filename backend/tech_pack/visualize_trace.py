# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import os
import base64
from io import BytesIO
from PIL import Image

def image_to_base64(image_path):
    if not image_path or not os.path.exists(image_path):
        return ""
    try:
        with Image.open(image_path) as img:
            # Resize for thumbnail if needed, but for now just convert
            img.thumbnail((300, 300))
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return ""

def generate_html_report(trace_file='trace.json', output_file='trace_report.html'):
    if not os.path.exists(trace_file):
        print(f"Error: {trace_file} not found.")
        return

    with open(trace_file, 'r') as f:
        data = json.load(f)

    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Optimization Trace Report</title>
        <style>
            body { font-family: sans-serif; margin: 20px; background-color: #f4f4f9; }
            h1, h2, h3 { color: #333; }
            .epoch-container { background: white; padding: 20px; margin-bottom: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .metrics { display: flex; gap: 20px; margin-bottom: 15px; font-weight: bold; color: #555; }
            .prompt-box { background: #eee; padding: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; margin-bottom: 20px; max-height: 200px; overflow-y: auto; }
            .example-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .example-table th, .example-table td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
            .example-table th { background-color: #f0f0f0; }
            .image-cell { width: 320px; text-align: center; }
            .image-cell img { max-width: 300px; max-height: 300px; border: 1px solid #ccc; }
            .score-good { color: green; }
            .score-bad { color: red; }
            .reasoning { font-size: 0.9em; color: #444; }
        </style>
    </head>
    <body>
        <h1>Optimization Trace Report</h1>
    """

    for epoch_data in data:
        epoch_num = epoch_data.get('epoch', 'Unknown')
        avg_scores = epoch_data.get('avg_scores', {})
        prompt = epoch_data.get('prompt', 'N/A')
        feedback = epoch_data.get('feedback', [])

        html_content += f"""
        <div class="epoch-container">
            <h2>Epoch {epoch_num}</h2>
            <div class="metrics">
                <span>Base: {avg_scores.get('base', 0):.2f}</span>
                <span>Arrow: {avg_scores.get('arrow', 0):.2f}</span>
                <span>Text: {avg_scores.get('text', 0):.2f}</span>
            </div>
            <h3>Prompt Template</h3>
            <div class="prompt-box">{prompt}</div>
            
            <h3>Training Examples</h3>
            <table class="example-table">
                <thead>
                    <tr>
                        <th>ID & Scores</th>
                        <th>Ground Truth</th>
                        <th>Source Image</th>
                        <th>Generated Image</th>
                        <th>Reasoning</th>
                    </tr>
                </thead>
                <tbody>
        """

        for item in feedback:
            item_id = item.get('id', 'Unknown')
            scores = item.get('scores', {})
            reasoning = item.get('reasoning', 'No reasoning provided.')
            source_img_path = item.get('source_image') or ''
            ref_img_path = item.get('ref_image') or ''
            gen_img_path = item.get('generated_image') or ''
            
            # Convert images to base64 for embedding
            source_b64 = image_to_base64(source_img_path)
            ref_b64 = image_to_base64(ref_img_path)
            gen_b64 = image_to_base64(gen_img_path)
            
            source_img_tag = f'<img src="data:image/png;base64,{source_b64}" alt="Source">' if source_b64 else "Image not found"
            ref_img_tag = f'<img src="data:image/png;base64,{ref_b64}" alt="Reference">' if ref_b64 else "Image not found"
            gen_img_tag = f'<img src="data:image/png;base64,{gen_b64}" alt="Generated">' if gen_b64 else "Image not found"

            html_content += f"""
                    <tr>
                        <td>
                            <strong>{item_id}</strong><br><br>
                            Base: {scores.get('base', 0)}<br>
                            Arrow: {scores.get('arrow', 0)}<br>
                            Text: {scores.get('text', 0)}
                        </td>
                        <td class="image-cell">{ref_img_tag}<br><small>{os.path.basename(ref_img_path)}</small></td>
                        <td class="image-cell">{source_img_tag}<br><small>{os.path.basename(source_img_path)}</small></td>
                        <td class="image-cell">{gen_img_tag}<br><small>{os.path.basename(gen_img_path)}</small></td>
                        <td class="reasoning">
                            <strong>Analysis:</strong><br>{item.get('analysis', 'N/A').replace('\n', '<br>')}<br><br>
                            <strong>Primary Failure:</strong><br>{item.get('primary_failure', 'N/A')}<br><br>
                            <strong>Actionable Feedback:</strong><br>{item.get('actionable_feedback', 'N/A')}<br><br>
                            <strong>Final Reasoning:</strong><br>{reasoning}
                        </td>
                    </tr>
            """

        html_content += """
                </tbody>
            </table>
        """
        
        # Validation Section
        val_feedback = epoch_data.get('val_feedback', [])
        val_avg_scores = epoch_data.get('val_avg_scores', {})
        
        if val_feedback:
            html_content += f"""
            <h3>Validation Results</h3>
            <div class="metrics">
                <span>Base: {val_avg_scores.get('base', 0):.2f}</span>
                <span>Arrow: {val_avg_scores.get('arrow', 0):.2f}</span>
                <span>Text: {val_avg_scores.get('text', 0):.2f}</span>
            </div>
            <table class="example-table">
                <thead>
                    <tr>
                        <th>ID & Scores</th>
                        <th>Ground Truth</th>
                        <th>Source Image</th>
                        <th>Generated Image</th>
                        <th>Reasoning</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for item in val_feedback:
                item_id = item.get('id', 'Unknown')
                scores = item.get('scores', {})
                reasoning = item.get('reasoning', 'No reasoning provided.')
                source_img_path = item.get('source_image') or ''
                ref_img_path = item.get('ref_image') or ''
                gen_img_path = item.get('generated_image') or ''
                
                source_b64 = image_to_base64(source_img_path)
                ref_b64 = image_to_base64(ref_img_path)
                gen_b64 = image_to_base64(gen_img_path)
                
                source_img_tag = f'<img src="data:image/png;base64,{source_b64}" alt="Source">' if source_b64 else "Image not found"
                ref_img_tag = f'<img src="data:image/png;base64,{ref_b64}" alt="Reference">' if ref_b64 else "Image not found"
                gen_img_tag = f'<img src="data:image/png;base64,{gen_b64}" alt="Generated">' if gen_b64 else "Image not found"
                
                html_content += f"""
                        <tr>
                            <td>
                                <strong>{item_id}</strong><br><br>
                                Base: {scores.get('base', 0)}<br>
                                Arrow: {scores.get('arrow', 0)}<br>
                                Text: {scores.get('text', 0)}
                            </td>
                            <td class="image-cell">{ref_img_tag}<br><small>{os.path.basename(ref_img_path)}</small></td>
                            <td class="image-cell">{source_img_tag}<br><small>{os.path.basename(source_img_path)}</small></td>
                            <td class="image-cell">{gen_img_tag}<br><small>{os.path.basename(gen_img_path)}</small></td>
                            <td class="reasoning">
                                <strong>Analysis:</strong><br>{item.get('analysis', 'N/A').replace('\n', '<br>')}<br><br>
                                <strong>Primary Failure:</strong><br>{item.get('primary_failure', 'N/A')}<br><br>
                                <strong>Actionable Feedback:</strong><br>{item.get('actionable_feedback', 'N/A')}<br><br>
                                <strong>Final Reasoning:</strong><br>{reasoning}
                            </td>
                        </tr>
                """
            
            html_content += """
                    </tbody>
                </table>
            """
        
        html_content += "</div>"

    html_content += """
    </body>
    </html>
    """

    with open(output_file, 'w') as f:
        f.write(html_content)
    
    print(f"Report generated: {output_file}")

if __name__ == "__main__":
    generate_html_report()
