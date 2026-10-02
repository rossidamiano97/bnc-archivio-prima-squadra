from pathlib import Path
p=Path("src/styles.css");s=p.read_text();css=Path("src/admin-v14.css").read_text();
if "admin-list-filters" not in s:p.write_text(s+"\n/* admin-v14 */\n"+css+"\n")
print("CSS ADMIN V14 OK")
