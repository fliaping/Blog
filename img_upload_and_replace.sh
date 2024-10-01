#!/bin/bash

uploads_dir="assets"
content_dir="content"
public_links_file="public_links.txt"
public_link_prefix="https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage"

# Step 1: Upload and get public links for all files in the 'images' directory
function upload_images_and_get_links() {

  # Check if the 'images' directory exists
  if [ ! -d "$uploads_dir" ]; then
    echo "Error: '$uploads_dir' directory not found!"
    exit 1
  fi

  # upload all file in images dir
  date_part=$(date +"%Y-%m-%d")
  time_part=$(date +"%H-%M")

  # 创建日期目录
  mkdir -p "./temp_$uploads_dir/$date_part/$time_part"

  # 将'uploads_dir'移动到时间子目录
  cp -r "./$uploads_dir/." "./temp_$uploads_dir/$date_part/$time_part/"

#   qshell qupload2 --bucket xpghost --src-dir "./temp_$uploads_dir" --overwrite --thread-count 5 --rescan-local
  ossutil64 --config-file ~/.ossutilconfig cp -r "./temp_$uploads_dir" oss://fliaping-blog/storage -u
  
  # Recursively upload and get public links for each file in the 'images' directory
  for file_path in $(find "$uploads_dir" -type f); do
    local public_link="$public_link_prefix/$date_part/$time_part${file_path#$uploads_dir}"
    echo "$file_path,$public_link" >> "$public_links_file"
  done

  echo "Step 1: Upload and get public links for '$uploads_dir' - Done!"
}

regex_escape_path() {
    echo "$1" | sed -e 's/[]\/$*.^[]/\\&/g'
}

escape_path() {
    local path="$1"
    # 使用反斜线转义特殊字符
    echo "$path" | sed -e 's/\*/\\*/g' \
                       -e 's/\$/\\$/g' \
                       -e 's/ /\\ /g' \
                       -e 's/\[/\\[/g' \
                       -e 's/\]/\\]/g'
}

# Step 2: Replace local image paths with public links in markdown files
function replace_image_paths_in_markdown() {

  # Check if the 'content' directory exists
  if [ ! -d "$content_dir" ]; then
    echo "Error: 'content' directory not found!"
    exit 1
  fi

  # Check if the 'public_links.txt' file exists
  if [ ! -f "$public_links_file" ]; then
    echo "Error: 'public_links.txt' file not found! Please run Step 1 first."
    exit 1
  fi

  # Read the 'public_links.txt' file and store paths and links in parallel arrays
  local_paths=()
  public_links=()
  while IFS=, read -r local_path public_link; do
    local_paths+=("$local_path")
    public_links+=("$public_link")
  done < "$public_links_file"

  # Recursively search and replace local image paths with public links in markdown files
  for file_path in $(find "$content_dir" -type f -name "*.md"); do
    file_path=$(escape_path "$file_path")
    # 获取子目录深度
    depth=$(echo "$file_path" | tr -cd '/' | wc -c)
    
    # 生成返回到根目录的路径
    back_to_root=$(printf '../%.0s' $(seq 1 $depth))

    # Use sed to replace image paths in markdown files
    for index in "${!local_paths[@]}"; do
      local local_path="${local_paths[$index]}"
      local public_link="${public_links[$index]}"
      local path_in_md="$back_to_root$local_path" 

      # 使用 uname 检测操作系统
      OS=$(uname)

      # 获取行号
      escaped_path=$(regex_escape_path "$path_in_md")
      m_pattern="!\\[.*\\]\\($escaped_path\\)"
      line_numbers=$(awk -v pattern="$m_pattern" 'match($0, pattern) { print NR }' "$file_path")

      # 如果有匹配的行，输出完整的行和行号
      if [ ! -z "$line_numbers" ]; then
          echo "\n[MATCHED:$path_in_md],[FILE:$file_path]"
          for line in $line_numbers; do
              line_content=$(sed -n "${line}p" "$file_path")
              echo "[$line]: $line_content"
          done

          # 用sed进行替换
          # 根据操作系统决定如何使用 sed 的 -i 选项
          if [ "$OS" = "Darwin" ]; then  # macOS
              sed -i "" -E "s~\!\[([^]]*)\]\($path_in_md\)~\!\[\1\]\($public_link\)~g" "./$file_path"
          else  # Linux
              sed -i -E "s~\!\[([^]]*)\]\($path_in_md\)~\!\[\1\]\($public_link\)~g" "./$file_path"
          fi

          # 输出对应行的最新内容
          echo -e "[REPLACED:$public_link],[FILE:$file_path]"
          for line in $line_numbers; do
              line_content=$(sed -n "${line}p" "$file_path")
              echo "[$line]: $line_content"
          done
      fi

      
    done
  done

  echo "Step 2: Replace local image paths with public links - Done!"
}

function clean_cache_dir() {
   cp -rv "./temp_$uploads_dir/"* "./achive_$uploads_dir"
   rm -rf "./temp_$uploads_dir"
   rm -rf "./$uploads_dir/"*
   rm "./$public_links_file"

   echo "Step 3: clean temp dir - Done!"
}

# Main execution
upload_images_and_get_links
replace_image_paths_in_markdown
clean_cache_dir
